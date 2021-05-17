const { Request, Response, SEND, RENDER, REDIRECT } = require('./helpers/utils');
const ScriptControl = require('../Controller/ScriptControl');
const { ExamModel } = require('../Model/ExamModel');
const { QuesModel } = require('../Model/QuesModel');
const { UserModel } = require('../Model/UserModel');
const { ScriptModel } = require('../Model/ScriptModel');
const mongoose  = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Test = require('./helpers/Test');

class ScriptControlTest extends Test {
    TestattemptReqPOST() {
        test("Answer a question in script successfully", async () => {
            const req = new Request({ key: '548934698347488383929929', role: true });
            const res = new Response();
            const mock = await scriptData.createMockExam(true, 3, false, '999955557777666655554446');
            await scriptData.createMockScript(mock, '548934698347488383929929', Date.now() - (5 * 60 * 1000));
            req.setBody({ examid: mock._id, quesid: mock.questions[0], selected: [0] });
            await ScriptControl.attemptReqPOST(req, res);
            expect(res.getSent().ok).toBe(true);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
            await ScriptModel.deleteMany({ examModel: mock._id });
        });
        test("Answer a question insufficient parameters", async () => {
            const req = new Request({ key: '548934698347488383929929', role: true });
            const res = new Response();
            req.setBody({ });
            await ScriptControl.attemptReqPOST(req, res);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Insufficient params');
        });
        test("Answer a question without logging in", async () => {
            const req = new Request();
            const res = new Response();
            req.setBody({ examid: null, quesid: null, selected: null });
            await ScriptControl.attemptReqPOST(req, res);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Unauthorized');
        });
        test("Answer a question as a teacher", async () => {
            const req = new Request({ key: '548934698347488383929929', role: false });
            const res = new Response();
            req.setBody({ examid: null, quesid: null, selected: null });
            await ScriptControl.attemptReqPOST(req, res);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Access denied');
        });
        test("Answer a question outside window", async () => {
            const req = new Request({ key: '548934698347488383929928', role: true });
            const res = new Response();
            const mock = await scriptData.createMockExam(
                true,
                3,
                false,
                '999955557777666655554446',
                { start: Date.now() - (16 * 3600 * 1000), end: Date.now() - (12 * 3600 * 1000) }
            );
            await scriptData.createMockScript(mock, '548934698347488383929928', Date.now());
            req.setBody({ examid: mock._id, quesid: mock.questions[0], selected: [0] });
            await ScriptControl.attemptReqPOST(req, res);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Attempted outside exam window');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
            await ScriptModel.deleteMany({ examModel: mock._id });
        });
    }
    TestendExamReqPOST() {
        test("End exam script successfully", async () => {
            const req = new Request({ key: '548934698347488383929927', role: true });
            const res = new Response();
            const mock = await scriptData.createMockExam(true, 3, false, '999955557777666655554446');
            await scriptData.createMockScript(mock, '548934698347488383929927', Date.now() - (5 * 60 * 1000));
            req.setBody({ examid: mock._id });
            await ScriptControl.endExamReqPOST(req, res);
            expect(res.getSent().ok).toBe(true);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
            await ScriptModel.deleteMany({ examModel: mock._id });
        });
        test("End exam with insufficient parameters", async () => {
            const req = new Request({ key: '548934698347488383929925', role: true });
            const res = new Response();
            req.setBody({ });
            await ScriptControl.endExamReqPOST(req, res);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Insufficient params');
        });
        test("End exam without logging in", async () => {
            const req = new Request();
            const res = new Response();
            req.setBody({ examid: null });
            await ScriptControl.endExamReqPOST(req, res);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Unauthorized');
        });
        test("End exam as a teacher", async () => {
            const req = new Request({ key: '548934698347488383929925', role: false });
            const res = new Response();
            req.setBody({ examid: null });
            await ScriptControl.endExamReqPOST(req, res);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Access denied');
        });
    }
    TestscriptStartReqGET() {
        test("Start exam successfully", async () => {
            const req = new Request({ key: '548934698347488383929923', role: true });
            const res = new Response();
            const mock = await scriptData.createMockExam(true, 3, false, '999955557777666655554446');
            req.setQuery({ id: mock._id });
            await ScriptControl.scriptStartReqGET(req, res);
            const query = await ScriptModel.find({ examModel: mock._id }).exec();
            expect(query.length).toBe(1);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
            await ScriptModel.deleteMany({ examModel: mock._id });
        });
        test("Start exam with insufficient parameters", async () => {
            const req = new Request({ key: '548934698347488383929923', role: true });
            const res = new Response();
            req.setQuery({ });
            await ScriptControl.scriptStartReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*exammsg\.ejs/g);
            expect(res.getRendered().data.data).toBe('Insufficient params');
        });
        test("Start exam without logging in", async () => {
            const req = new Request();
            const res = new Response();
            req.setQuery({ id: null });
            await ScriptControl.scriptStartReqGET(req, res);
            expect(res.method).toBe(REDIRECT);
            expect(res.getRedirected()).toBe('/login');
        });
        test("Start exam as a teacher", async () => {
            const req = new Request({ key: '548934698347488383929923', role: false });
            const res = new Response();
            req.setQuery({ id: null });
            await ScriptControl.scriptStartReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*exammsg\.ejs/g);
            expect(res.getRendered().data.data).toBe('Forbidden request');
        });
    }
    TestgetScriptHistory() {
        test("Get students past scripts", async () => {
            const mock = await scriptData.createMockExam(true, 3, false, '999955557777666655554446');
            await scriptData.createMockScript(mock, '548934698347488383929922', Date.now() - (5 * 60 * 1000));
            const actResult = await ScriptControl.getScriptHistory('548934698347488383929922');
            expect(actResult.length).toBe(1);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
            await ScriptModel.deleteMany({ examModel: mock._id });
        });
    }
    TestscriptTeachReqGET() {
        test("Get script of a student successfully", async () => {
            const req = new Request({ key: '246728721351278243848585', role: false });
            const res = new Response();
            const mock = await scriptData.createMockExam(true, 3, false, '246728721351278243848585');
            await scriptData.createMockScript(mock, '111166662222555599993333', Date.now());
            req.setQuery({ id: mock._id, by: '111166662222555599993333' });
            await ScriptControl.scriptTeachReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*examrun\.ejs/g);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
            await ScriptModel.deleteMany({ examModel: mock._id });
        });
        test("Get script with insufficient parameters", async () => {
            const req = new Request({ key: '246728721351278243848585', role: false });
            const res = new Response();
            req.setQuery({ });
            await ScriptControl.scriptTeachReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*exammsg\.ejs/g);
            expect(res.getRendered().data.data).toBe('Insufficient params');
        });
        test("Get script without logging in", async () => {
            const req = new Request();
            const res = new Response();
            req.setQuery({ id: null, by: null });
            await ScriptControl.scriptTeachReqGET(req, res);
            expect(res.method).toBe(REDIRECT);
            expect(res.getRedirected()).toBe('/login');
        });
        test("Get script as a student", async () => {
            const req = new Request({ key: '246728721351278243848585', role: true });
            const res = new Response();
            req.setQuery({ id: null, by: null });
            await ScriptControl.scriptTeachReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*exammsg\.ejs/g);
            expect(res.getRendered().data.data).toBe('Forbidden request');
        });
        test("Get script of exam created by another teacher", async () => {
            const req = new Request({ key: '246728721351278243848585', role: false });
            const res = new Response();
            const mock = await scriptData.createMockExam(true, 3, false, '246728721351278243848588');
            req.setQuery({ id: mock._id, by: null });
            await ScriptControl.scriptTeachReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*exammsg\.ejs/g);
            expect(res.getRendered().data.data).toBe('You do not have permission to view this page');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
    }
    TestscriptReqGET() {
        test("Goto exam page - early", async () => {
            const req = new Request({ key: '777777777777777777777777', role: true });
            const res = new Response();
            const mock = await scriptData.createMockExam(
                false,
                3,
                false,
                '246728721351278243848581',
                { start: Date.now() + (3 * 3600 * 1000), end: Date.now() + (6 * 3600 * 1000) }
            );
            req.setQuery({ id: mock._id });
            await ScriptControl.scriptReqGET(req, res);
            expect(res.getRendered().data.code).toBe(6);
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Goto exam page - not started", async () => {
            const req = new Request({ key: '777777777777777777777777', role: true });
            const res = new Response();
            const mock = await scriptData.createMockExam(
                false,
                3,
                false,
                '246728721351278243848581',
                { start: Date.now() - (3 * 3600 * 1000), end: Date.now() + (6 * 3600 * 1000) }
            );
            req.setQuery({ id: mock._id });
            await ScriptControl.scriptReqGET(req, res);
            expect(res.getRendered().data.code).toBe(1);
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Goto exam page - missed", async () => {
            const req = new Request({ key: '777777777777777777777777', role: true });
            const res = new Response();
            const mock = await scriptData.createMockExam(
                false,
                3,
                false,
                '246728721351278243848581',
                { start: Date.now() - (6 * 3600 * 1000), end: Date.now() - (3 * 3600 * 1000) }
            );
            req.setQuery({ id: mock._id });
            await ScriptControl.scriptReqGET(req, res);
            expect(res.getRendered().data.code).toBe(5);
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Goto exam page - submitted", async () => {
            const req = new Request({ key: '777777777777777777777777', role: true });
            const res = new Response();
            const mock = await scriptData.createMockExam(
                false,
                3,
                false,
                '246728721351278243848581',
                { start: Date.now() - (3 * 3600 * 1000), end: Date.now() + (3 * 3600 * 1000) }
            );
            await scriptData.createMockScript(mock, '777777777777777777777777', Date.now(), true);
            req.setQuery({ id: mock._id });
            await ScriptControl.scriptReqGET(req, res);
            expect(res.getRendered().data.code).toBe(3);
            await ExamModel.deleteMany({ _id: mock._id });
            await ScriptModel.deleteMany({ examModel: mock._id });
        });
        test("Goto exam page - already started", async () => {
            const req = new Request({ key: '777777777777777777777777', role: true });
            const res = new Response();
            const mock = await scriptData.createMockExam(
                false,
                3,
                false,
                '246728721351278243848581',
                { start: Date.now() - (3 * 3600 * 1000), end: Date.now() + (3 * 3600 * 1000) }
            );
            await scriptData.createMockScript(mock, '777777777777777777777777', Date.now(), false);
            req.setQuery({ id: mock._id });
            await ScriptControl.scriptReqGET(req, res);
            expect(res.getRendered().data.showresult).toBe(false);
            await ExamModel.deleteMany({ _id: mock._id });
            await ScriptModel.deleteMany({ examModel: mock._id });
        });
        test("Goto exam page - result available", async () => {
            const req = new Request({ key: '777777777777777777777777', role: true });
            const res = new Response();
            const mock = await scriptData.createMockExam(
                false,
                3,
                false,
                '246728721351278243848581',
                { start: Date.now() - (6 * 3600 * 1000), end: Date.now() - (3 * 3600 * 1000) }
            );
            await scriptData.createMockScript(mock, '777777777777777777777777', Date.now() - (4.5 * 3600 * 1000), false);
            req.setQuery({ id: mock._id });
            await ScriptControl.scriptReqGET(req, res);
            expect(res.getRendered().data.showresult).toBe(true);
            await ExamModel.deleteMany({ _id: mock._id });
            await ScriptModel.deleteMany({ examModel: mock._id });
        });
    }
    TestdloadBulkReqGET() {
        test("Should return grade sheet without error", async () => {
            const req = new Request({ key: '246728721351278243848577', role: false });
            const res = new Response();
            const mock = await scriptData.createMockExam(true, 3, false, '246728721351278243848577');
            await new UserModel(
                { _id: new ObjectId('111166662222555511112222'), userName: 'userA', studentID: '13131313' }
            ).save();
            await new UserModel(
                { _id: new ObjectId('111166662222555511112223'), userName: 'userB', studentID: '24242424' }
            ).save();
            await scriptData.createMockScript(mock, '111166662222555511112222', Date.now());
            await scriptData.createMockScript(mock, '111166662222555511112223', Date.now());
            req.setQuery({ id: mock._id });
            await ScriptControl.dloadBulkReqGET(req, res);
            expect(res.getSent().split('\n').length).toBe(3);
            await ExamModel.deleteMany({ _id: mock._id });
            await ScriptModel.deleteMany({ examModel: mock._id });
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await UserModel.deleteOne({ userName: 'userA' });
            await UserModel.deleteOne({ userName: 'userB' });
        });
        test("Return grade sheet with insufficient parameters", async () => {
            const req = new Request({ key: '246728721351278243848577', role: false });
            const res = new Response();
            req.setQuery({ });
            await ScriptControl.dloadBulkReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*exammsg\.ejs/g);
            expect(res.getRendered().data.data).toBe('Insufficient params');
        });
        test("Return grade sheet without logging in", async () => {
            const req = new Request();
            const res = new Response();
            req.setQuery({ id: null, by: null });
            await ScriptControl.dloadBulkReqGET(req, res);
            expect(res.method).toBe(REDIRECT);
            expect(res.getRedirected()).toBe('/login');
        });
        test("Return grade sheet as a student", async () => {
            const req = new Request({ key: '246728721351278243848577', role: true });
            const res = new Response();
            req.setQuery({ id: '368942423984239239329299' });
            await ScriptControl.dloadBulkReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*exammsg\.ejs/g);
            expect(res.getRendered().data.data).toBe('Forbidden request');
        });
        test("Return grade sheet of exam created by another teacher", async () => {
            const req = new Request({ key: '246728721351278243848577', role: false });
            const res = new Response();
            const mock = await scriptData.createMockExam(true, 3, false, '246728721351278243848573');
            req.setQuery({ id: mock._id, by: null });
            await ScriptControl.dloadBulkReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*exammsg\.ejs/g);
            expect(res.getRendered().data.data).toBe('You do not have permission to view this page');
            await ExamModel.deleteMany({ _id: mock._id });
        });
    }
}

function Template() {
    this._id = new ObjectId();
    this.randomSet = false;
    this.setFilterCount = 0;
    this.questions = [];
    this.name = "Exam4499";
    this.duration = 15;
    this.windowStart = Date.now();
    this.windowEnd = Date.now();
    this.createdBy = "6099b5f57ad90c2220ee0f72";
}

function QuesTemplate(examID) {
    this._id = new ObjectId();
    this.belongsTo = examID;
    this.headText = "Ques202019";
    this.checkbox = false;
    this.points = 4;
    this.attempts = 2;
    this.options = [
        { label: "nc a", correct: true  },
        { label: "nc b", correct: false }
    ];
}

function ScriptTemplate(exam, authorID, start, finished) {
    this.submittedBy = authorID;
    this.examModel = exam._id;
    this.startTime = start;
    this.finished = finished;
    this.answers = exam.questions.map(id => { return { quesID: id, selected: [], attempts: 2 }; });
}

const scriptData = {
    createMockExam: async (makeQues, count, set, owner, window) => {
        const exam = new Template();
        if(makeQues) {
            for (let i = 0; i < 3; i++) {
                const temp = new QuesModel(new QuesTemplate(exam._id));
                await temp.save();
                exam.questions.push(temp._id);
            }
            exam.setFilterCount = count || 3;
            exam.randomSet = set || false;
        }
        exam.windowStart = window ? window.start : Date.now() - (3 * 3600 * 1000);
        exam.windowEnd   = window ? window.end   : Date.now() + (3 * 3600 * 1000);
        exam.createdBy = owner || "6099b5f57ad90c2220ee0f72";
        await new ExamModel(exam).save();
        return exam;
    },
    createMockQues: async (examID) => {
        const ques = new QuesModel(new QuesTemplate(examID));
        await ques.save();
        return ques;
    },
    mockExamAuthor: async (authorID) => {
        const exam = new Template();
        exam.createdBy = authorID;
        await new ExamModel(exam).save();
        return exam;
    },
    createMockScript: async (exam, authorID, start, finished) => {
        const script = new ScriptModel(new ScriptTemplate(exam, authorID, start, finished || false));
        await script.save();
        return script;
    }
};

module.exports = ScriptControlTest;