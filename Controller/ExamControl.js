const { ExamModelOperation } = require('../Model/ExamModel');
const { ScriptModelOperation } = require('../Model/ScriptModel');
const { Result, scanParams, sessExist, mapOtions, renderERR } = require('../utils/general');
const path = require('path');

class ExamControl {
    static async newExamReqPOST(req, res) {

        if(!scanParams(req.body, ['name', 'duration', 'start', 'end'])) {
            res.send({ ok: false, msg: 'Insufficient params' });
            return;
        }

        if(!sessExist(req)) {
            res.send({ ok: false, msg: 'Unauthorized' });
            return;
        }

        let { key, role } = req.session.user;
        if(role) {
            res.send({ ok: false, msg: 'Access denied' });
            return;
        }

        let authorID    = key;
        let name        = req.body.name;
        let duration    = req.body.duration;
        let windowStart = new Date(req.body.start);
        let windowEnd   = new Date(req.body.end);

        const exam = Result.convDB(await ExamModelOperation.createExam(authorID, name, duration, windowStart, windowEnd));
        if(!exam.ok) {
            res.send({ ok: false, msg: 'Failure creating exam' });
            return;
        }

        let examID = exam.load._id;
        res.send({ ok: true, msg: 'OK', examID: String(examID) });
    }

    static async dropExamReqPOST(req, res) {

        if(!scanParams(req.body, ['id'])) {
            res.send({ ok: false, msg: 'Insufficient params' });
            return;
        }

        if(!sessExist(req)) {
            res.send({ ok: false, msg: 'Unauthorized' });
            return;
        }

        let { key, role } = req.session.user;
        if(role) {
            res.send({ ok: false, msg: 'Access denied' });
            return;
        }

        let authorID = key;
        let examID   = req.body.id;

        const info = Result.convDB(await ExamModelOperation.getShortInfo(examID));
        if(!info.ok) {
            res.send({ ok: false, msg: info.msg });
            return;
        }

        if(String(info.load.author) !== authorID) {
            res.send({ ok: false, msg: 'No permission' });
            return;
        }

        const drop = Result.convDB(await ExamModelOperation.dropExam(examID));

        if(!drop.ok) {
            res.send({ ok: false, msg: update.msg });
        } else {
            res.send({ ok: true, msg: 'OK' });
        }

        await ScriptModelOperation.dropScripts(examID);
    }

    static async editExamReqGET(req, res) {

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
            renderERR(res, 'You do not have permission to edit this page');
            return;
        }

        const exam = Result.convDB(await ExamModelOperation.getExamFull(examID));
        if(!exam.ok) { renderERR(res, exam.msg); return; }
        
        const data = {
            name: exam.load.name,
            windowStart: exam.load.windowStart.toLocaleString("en-US", {timeZone: "Asia/Dhaka"}),
            windowEnd: exam.load.windowEnd.toLocaleString("en-US", {timeZone: "Asia/Dhaka"}),
            duration: exam.load.duration,
            setBased: exam.load.setBased,
            quesPerSet: exam.load.quesPerSet,
            quesPool: ExamControl.mapToRender(exam.load.quesPool),
            host: `${req.protocol}://${req.get('host')}/exam?id=${exam.load._id}`,
            id: exam.load._id
        };

        res.render(path.join(__dirname, '../View/pages/examedit.ejs'), data);
    }

    static async getExamHistory(userID) {
        const history = Result.convDB(await ExamModelOperation.getCreatedExams(userID));
        return history.ok ? history.load : [];
    }

    static async addQuesReqPOST(req, res) {

        if(!scanParams(req.body, ['examid', 'head', 'checkbox', 'points', 'attempts', 'options'])) {
            res.send({ ok: false, msg: 'Insufficient params' });
            return;
        }

        if(!sessExist(req)) {
            res.send({ ok: false, msg: 'Unauthorized' });
            return;
        }

        let { key, role } = req.session.user;
        if(role) {
            res.send({ ok: false, msg: 'Access denied' });
            return;
        }

        let authorID = key;
        let examID   = req.body.examid;

        const info = Result.convDB(await ExamModelOperation.getShortInfo(examID));
        if(!info.ok) {
            res.send({ ok: false, msg: info.msg });
            return;
        }

        if(String(info.load.author) !== authorID) {
            res.send({ ok: false, msg: 'No permission' });
            return;
        }

        let headText = req.body.head;
        let checkbox = req.body.checkbox;
        let points   = req.body.points;
        let attempts = req.body.attempts;
        let options  = req.body.options;

        const insert = Result.convDB(await ExamModelOperation.insertQues(examID, headText, checkbox, points, attempts, options));
        if(!insert.ok) {
            res.send({ ok: false, msg: insert.msg });
        } else {
            res.send({ ok: true, msg: 'OK', qsid: insert.load._id });
        }
    }

    static async delQuesReqPOST(req, res) {

        if(!scanParams(req.body, ['quesid', 'examid'])) {
            res.send({ ok: false, msg: 'Insufficient params' });
            return;
        }

        if(!sessExist(req)) {
            res.send({ ok: false, msg: 'Unauthorized' });
            return;
        }

        let { key, role } = req.session.user;
        if(role) {
            res.send({ ok: false, msg: 'Access denied' });
            return;
        }

        let authorID = key;
        let examID   = req.body.examid;

        const info = Result.convDB(await ExamModelOperation.getShortInfo(examID));
        if(!info.ok) {
            res.send({ ok: false, msg: info.msg });
            return;
        }

        if(String(info.load.author) !== authorID) {
            res.send({ ok: false, msg: 'No permission' });
            return;
        }

        let quesID = req.body.quesid;

        const deletion = Result.convDB(await ExamModelOperation.delQues(examID, quesID));
        if(!deletion.ok) {
            res.send({ ok: false, msg: update.msg });
        } else {
            res.send({ ok: true, msg: 'OK' });
        }
    }

    static async updateExamReqPOST(req, res) {

        if(!scanParams(req.body, ['id', 'name', 'duration', 'randomset', 'perset', 'start', 'end'])) {
            res.send({ ok: false, msg: 'Insufficient params' });
            return;
        }

        if(!sessExist(req)) {
            res.send({ ok: false, msg: 'Unauthorized' });
            return;
        }

        let { key, role } = req.session.user;
        if(role) {
            res.send({ ok: false, msg: 'Access denied' });
            return;
        }

        let authorID = key;
        let examID   = req.body.id;

        const info = Result.convDB(await ExamModelOperation.getShortInfo(examID));
        if(!info.ok) {
            res.send({ ok: false, msg: info.msg });
            return;
        }

        if(String(info.load.author) !== authorID) {
            res.send({ ok: false, msg: 'No permission' });
            return;
        }

        let name        = req.body.name;
        let duration    = req.body.duration;
        let setBased    = req.body.randomset;
        let quesPerSet  = req.body.perset;
        let windowStart = new Date(req.body.start);
        let windowEnd   = new Date(req.body.end);

        const update = Result.convDB(await ExamModelOperation.updateExam(examID, name, duration, windowStart, windowEnd, setBased, quesPerSet));
        if(!update.ok) {
            res.send({ ok: false, msg: update.msg });
        } else {
            res.send({ ok: true, msg: 'OK' });
        }
    }

    static mapToRender(quesPool) {
        return quesPool.map(ques => {
            let corr = ques.checkbox 
                ? ques.correctIndexes
                : ques.correctIndex;
            return {
                id: ques._id,
                text: ques.questionText,
                points: ques.points,
                checkbox: ques.checkbox,
                attempts: ques.attempts,
                options: mapOtions(ques.options, corr)
            };
        });
    }
}

module.exports = ExamControl;