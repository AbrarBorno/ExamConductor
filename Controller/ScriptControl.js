const { ExamModelOperation } = require('../Model/ExamModel');
const { ScriptModelOperation } = require('../Model/ScriptModel');
const { Result, mapAttemptOptions, sessExist, scanParams, renderMSG, renderERR } = require('../utils/general');
const { AnswerMCQ, AnswerCheckbox } = require('./classes');
const path = require('path');

const EXAM_NOT_STARTED = 1,
      EXAM_STARTED = 2,
      EXAM_SUBMITTED = 3,
      EXAM_DONE_EXPIRED = 4,
      EXAM_MISSED = 5,
      EXAM_EARLY = 6,
      EXAM_ERROR = 7;

const SORTFN = (a, b) => a - b;
const arraysEqual = (a, b) => {
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

class ScriptControl {

    static async scriptReqGET(req, res) {

        if(!scanParams(req.query, ['id'])) {
            renderERR(res, 'Insufficient params');
            return;
        }

        if(!sessExist(req)) {
            res.redirect('/login');
            return;
        }

        let { key, role } = req.session.user;
        if(!role) {
            renderERR(res, 'Forbidden request');
            return;
        }

        let userID = key;
        let examID = req.query.id;

        const script = await ScriptControl.processAnswerScript(userID, examID);

        switch(script.examCode) {
            case EXAM_ERROR:
                renderMSG(res, script.examCode, script.params.text);
                break;
            case EXAM_EARLY:
                renderMSG(res, script.examCode, script.params.exam.windowStart.toLocaleString("en-US", {timeZone: "Asia/Dhaka"}));
                break;
            case EXAM_NOT_STARTED:
                renderMSG(res, script.examCode, { link: `/startxm?id=${examID}`, duration: calcMinTime(script.params.exam.duration, script.params.exam.windowEnd) });
                break;
            case EXAM_SUBMITTED:
                renderMSG(res, script.examCode, script.params.exam.windowEnd.toLocaleString("en-US", {timeZone: "Asia/Dhaka"}));
                break;
            case EXAM_MISSED:
                renderMSG(res, script.examCode, null);
                break;
            case EXAM_STARTED:
            case EXAM_DONE_EXPIRED:
                const exam = script.params.exam;
                const data = {
                    name:        exam.name,
                    windowStart: exam.windowStart.toISOString().split('.')[0],
                    windowEnd:   exam.windowEnd.toISOString().split('.')[0],
                    duration:    exam.duration,
                    remaining:   countdown(script.params.startTime, calcMinTime(exam.duration, exam.windowEnd)),
                    setBased:    exam.setBased,
                    quesPerSet:  exam.quesPerSet,
                    quesPool:    script.params.props,
                    obtained:    ScriptControl.calcObtained(script.params.props),
                    showresult:  script.examCode === EXAM_DONE_EXPIRED,
                    stview:      true,
                    id:          exam._id
                };
                res.render(path.join(__dirname, '../View/pages/examrun.ejs'), data);
                break;
        }
    }

    static async scriptTeachReqGET(req, res) {

        if(!scanParams(req.query, ['id', 'by'])) {
            renderERR(res, 'Insufficient params');
            return;
        }

        if(!sessExist(req)) {
            res.redirect('/login');
            return;
        }

        let { key, role } = req.session.user;
        if(role) {
            renderERR(res, 'Forbidden request');
            return;
        }

        let authorID = key;
        let examID   = req.query.id;

        const info = Result.convDB(await ExamModelOperation.getShortInfo(examID));
        if(!info.ok) { renderERR(res, info.msg); return; }

        if(String(info.load.author) !== authorID) {
            renderERR(res, 'You do not have permission to view this page');
            return;
        }

        let studentID = req.query.by;

        const script = await ScriptControl.processAnswerScript(studentID, examID);
        if(script.examCode === EXAM_ERROR) {
            renderMSG(res, script.examCode, script.params.text);
        } else {
            const exam = script.params.exam;
            const data = {
                name:        exam.name,
                windowStart: exam.windowStart.toISOString().split('.')[0],
                windowEnd:   exam.windowEnd.toISOString().split('.')[0],
                duration:    exam.duration,
                remaining:   0,
                setBased:    exam.setBased,
                quesPerSet:  exam.quesPerSet,
                quesPool:    script.params.props,
                obtained:    ScriptControl.calcObtained(script.params.props),
                showresult:  true,
                stview:      false,
                id:          exam._id
            };
            res.render(path.join(__dirname, '../View/pages/examrun.ejs'), data);
        }
    }

    static async getScriptHistory(userID) {
        const history = Result.convDB(await ScriptModelOperation.getSubmission(userID));
        if(!history.ok) {
            return [];
        } else {
            let now = Date.now();
            return history.load.map(val => {
                return {
                    name: val.name,
                    id: String(val.id),
                    ended: now >= val.windowEnd,
                    due: val.windowEnd.toLocaleString("en-US", {timeZone: "Asia/Dhaka"})
                };
            });
        }
    }

    static async scriptStartReqGET(req, res) {

        if(!scanParams(req.query, ['id'])) {
            renderERR(res, 'Insufficient params');
            return;
        }

        if(!sessExist(req)) {
            res.redirect('/login');
            return;
        }

        let { key, role } = req.session.user;
        if(!role) {
            renderERR(res, 'Forbidden request');
            return;
        }

        let userID = key;
        let examID = req.query.id;

        const detState = await ScriptControl.determineState(userID, examID);
        if(!detState.ok) { renderERR(res, detState.msg); return; }

        if(detState.load === EXAM_NOT_STARTED) {
            const script = Result.convDB(await ScriptModelOperation.makeScript(userID, examID));
            if(!script.ok) { renderERR(res, script.msg); return; }
        }

        res.redirect(`/exam?id=${examID}`);
    }

    static async endExamReqPOST(req, res) {

        if(!scanParams(req.body, ['examid'])) {
            res.send({ ok: false, msg: 'Insufficient params' });
            return;
        }

        if(!sessExist(req)) {
            res.send({ ok: false, msg: 'Unauthorized' });
            return;
        }

        let { key, role } = req.session.user;
        if(!role) {
            res.send({ ok: false, msg: 'Access denied' });
            return;
        }

        let userID = key;
        let examID = req.body.examid;

        const scriptInfo = Result.convDB(await ScriptModelOperation.getScriptInfo(userID, examID));
        if(!scriptInfo.ok) {
            res.send({ ok: false, msg: scriptInfo.msg });
            return;
        }

        let scriptID = scriptInfo.load._id;

        const close = Result.convDB(await ScriptModelOperation.endExamScript(scriptID));
        if(!close.ok) {
            res.send({ ok: false, msg: close.msg });
        } else {
            res.send({ ok: true, msg: 'OK' });
        }
    }

    static async attemptReqPOST(req, res) {

        if(!scanParams(req.body, ['examid', 'quesid', 'selected'])) {
            res.send({ ok: false, msg: 'Insufficient params' });
            return;
        }

        if(!sessExist(req)) {
            res.send({ ok: false, msg: 'Unauthorized' });
            return;
        }

        let { key, role } = req.session.user;
        if(!role) {
            res.send({ ok: false, msg: 'Access denied' });
            return;
        }

        let userID   = key;
        let examID   = req.body.examid;
        let quesID   = req.body.quesid;
        let selected = req.body.selected;

        const detState = await ScriptControl.determineState(userID, examID);
        if(!detState.ok) {
            res.send({ ok: false, msg: detState.msg });
            return;
        }

        if(detState.load !== EXAM_STARTED) {
            res.send({ ok: false, msg: 'Attempted outside exam window' });
            return;
        }

        const scriptInfo = Result.convDB(await ScriptModelOperation.getScriptInfo(userID, examID));
        if(!scriptInfo.ok) {
            res.send({ ok: false, msg: scriptInfo.msg });
            return;
        }

        let scriptID = scriptInfo.load._id;

        const attempt = Result.convDB(await ScriptModelOperation.attemptQues(scriptID, quesID, selected));
        if(!attempt.ok) {
            res.send({ ok: false, msg: attempt.msg });
        } else {
            res.send({ ok: true, msg: 'OK' });
        }
    }

    static async determineState(userID, examID) {
        const examInfo = Result.convDB(await ExamModelOperation.getShortInfo(examID));
        if(!examInfo.ok) return examInfo;
        const exam = examInfo.load;

        const dateTime = Date.now();

        if(dateTime < exam.windowStart.getTime()) return Result.okResult(EXAM_EARLY);

        const scriptExistInfo = Result.convDB(await ScriptModelOperation.doesScriptExist(userID, examID));
        if(!scriptExistInfo.ok) return scriptExistInfo;
        const scriptExist = scriptExistInfo.load;
        
        if(dateTime > exam.windowEnd.getTime()) return Result.okResult(scriptExist ? EXAM_DONE_EXPIRED : EXAM_MISSED);

        if(!scriptExist) return Result.okResult(EXAM_NOT_STARTED);

        const scriptInfo = Result.convDB(await ScriptModelOperation.getScriptInfo(userID, examID));
        if(!scriptInfo.ok) return scriptInfo;
        const script = scriptInfo.load;

        if(!withinFrame(script.startTime, exam.duration)) return Result.okResult(EXAM_SUBMITTED);

        return Result.okResult(script.submitPressed ? EXAM_SUBMITTED : EXAM_STARTED);
    }

    static async processAnswerScript(userID, examID) {
        const detState = await ScriptControl.determineState(userID, examID);
        if(!detState.ok) return { examCode: EXAM_ERROR, resCode: 500, params: { text: detState.msg } };
        const state = detState.load;

        switch(state) {
            case EXAM_NOT_STARTED:
            case EXAM_MISSED:
            case EXAM_EARLY:
                const examInfo = Result.convDB(await ExamModelOperation.getShortInfo(examID));
                if(!examInfo.ok) return { examCode: EXAM_ERROR, resCode: 500, params: { text: examInfo.msg } };
                const exam = examInfo.load;
                return { examCode: state, resCode: 200, params: { exam } };
            case EXAM_STARTED:
            case EXAM_SUBMITTED:
            case EXAM_DONE_EXPIRED:
                const shortInfo = Result.convDB(await ExamModelOperation.getShortInfo(examID));
                if(!shortInfo.ok) return { examCode: EXAM_ERROR, resCode: 500, params: { text: shortInfo.msg } };

                const script = Result.convDB(await ScriptModelOperation.getScript(userID, examID));
                if(!script.ok) return { examCode: EXAM_ERROR, resCode: 500, params: { text: script.msg } };

                const mapped = ScriptControl.mapQuesAns(script.load.sortedQues, script.load.attempts);
                
                const evaluated = ScriptControl.mapToRender(ScriptControl.evalQuesAns(mapped));
                
                return { examCode: state, resCode: 200, params: { exam: shortInfo.load, props: evaluated, startTime: script.load.startTime } };
        }
    }

    static async dloadBulkReqGET(req, res) {

        if(!scanParams(req.query, ['id'])) {
            renderERR(res, 'Insufficient params');
            return;
        }

        if(!sessExist(req)) {
            res.redirect('/login');
            return;
        }

        let { key, role } = req.session.user;
        if(role) {
            renderERR(res, 'Forbidden request');
            return;
        }

        let authorID = key;
        let examID   = req.query.id;

        const info = Result.convDB(await ExamModelOperation.getShortInfo(examID));
        if(!info.ok) { renderERR(res, info.msg); return; }

        if(String(info.load.author) !== authorID) {
            renderERR(res, 'You do not have permission to view this page');
            return;
        }

        const questions = Result.convDB(await ExamModelOperation.getAllQues(examID));
        if(!questions.ok) { renderERR(res, questions.msg); return; }

        const merged = Result.convDB(await ScriptModelOperation.getSubmissionMult(examID));
        if(!merged.ok) { renderERR(res, merged.msg); return; }

        const mappedEval = merged.load.map(sub => {
            return {
                stid: String(sub.stid),
                studentID: sub.studentID,
                userName: sub.userName,
                score: ScriptControl.calcScoreZip(
                    ScriptControl.evalQuesAns(
                        ScriptControl.mapQuesAns(
                            questions.load,
                            sub.answers
                        )
                    )
                )
            };
        });

        res.status(200).attachment(makeFileName(info.load)).send([
            'Username,StudentID,Obtained,Total,Percent,Link',
            ...mappedEval.map(val => [
                val.userName,
                val.studentID,
                val.score.obtained,
                val.score.total,
                ((val.score.obtained / val.score.total) * 100).toFixed(2),
                `${req.protocol}://${req.get('host')}/xmcheck?id=${examID}&by=${val.stid}`
            ].join(','))
        ].join('\n'));
    }

    static mapQuesAns(quesArray, attemptArray) {
        const dataMap = new Map();
        quesArray.forEach(val => { dataMap.set(String(val._id), { ques: val, ans:  null }); });
        attemptArray.forEach(val => {
            const key = String(val.quesID);
            if(dataMap.has(key)) {
                const pair = dataMap.get(key);
                pair.ans = pair.ques.checkbox
                    ? new AnswerCheckbox(key, val.attempts, val.selected)
                    : new AnswerMCQ(key, val.attempts, val.selected);
            }
        });
        const pairArray = [];
        dataMap.forEach(val => pairArray.push(val));
        return pairArray.filter(val => val.ans !== null);
    }

    static evalQuesAns(mappedArray) {
        return mappedArray.map(val => {
            return {
                ques: val.ques,
                ans: val.ans,
                correct: ScriptControl.evalSingle(val)
            };
        });
    }

    static evalSingle(pair) {
        const ques = pair.ques.checkbox ? pair.ques.correctIndexes : pair.ques.correctIndex;
        const ans  = pair.ques.checkbox ? pair.ans.selectedIndexes : pair.ans.selectedIndex;
        ques.sort(SORTFN);
        ans.sort(SORTFN);
        return arraysEqual(ques, ans);
    }

    static mapToRender(quesPool) {
        return quesPool.map(pair => {
            let ques = pair.ques;
            let ans  = pair.ans;

            let corr = ques.checkbox 
                ? ques.correctIndexes
                : ques.correctIndex;
            
            let chkd = ques.checkbox 
                ? ans.selectedIndexes
                : ans.selectedIndex;
            
            return {
                id: ques._id,
                text: ques.questionText,
                points: ques.points,
                checkbox: ques.checkbox,
                attempts: ans.attemptRem,
                success: pair.correct,
                options: mapAttemptOptions(ques.options, corr, chkd)
            };
        });
    }

    static calcObtained(array) {
        let obtained = 0;
        let total = 0;
        array.forEach(val => {
            total += val.points;
            obtained += val.success ? val.points : 0;
        });
        return `${obtained}/${total}`;
    }

    static calcScoreZip(array) {
        let obtained = 0;
        let total = 0;
        array.forEach(val => {
            total += val.ques.points;
            obtained += val.correct ? val.ques.points : 0;
        });
        return {obtained, total};
    }
}

const calcMinTime = (duration, ends) => {
    const diff = ((ends.getTime() - Date.now()) / (60 * 1000)) | 0;
    return Math.min(diff, duration);
};

const countdown = (startTime, remaining) => {
    const endsAt = new Date(startTime.getTime() + remaining * 60 * 1000);
    return ((endsAt.getTime() - Date.now()) / (60 * 1000)) | 0;
};

const withinFrame = (startTime, duration) => {
    const endsAt = new Date(startTime.getTime() + duration * 60 * 1000);
    return Date.now() < endsAt.getTime();
};

const makeFileName = (exam) => {
    const name = exam.name.replace(/ /g, '_');
    const date = new Date().toUTCString().replace(/, | /g, '_').replace(/:/g, '-').replace(/_GMT/g, '.csv');
    return name + '_' + date;
};

module.exports = ScriptControl;