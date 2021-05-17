const { Request, Response, SEND, RENDER, REDIRECT } = require('./helpers/utils');
const ExamControl = require('../Controller/ExamControl');
const { ExamModel } = require('../Model/ExamModel');
const { QuesModel } = require('../Model/QuesModel');
const mongoose  = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Test = require('./helpers/Test');

class ExamControlTest extends Test {
    TestnewExamReqPOST() {
        test("Request for creating new exam", async () => {
            const req = new Request({ key: '999988887777666655554444', role: false });
            const res = new Response();
            req.setBody({
                name: 'utexam1223',
                duration: 20,
                start: Date.now(),
                end: Date.now() + 3600 * 1000
            });
            await ExamControl.newExamReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(true);
            await ExamModel.deleteMany({ name: 'utexam1223' });
        });
        test("Create exam without being logged in", async () => {
            const req = new Request();
            const res = new Response();
            req.setBody({
                name: 'utexam1223',
                duration: 20,
                start: Date.now(),
                end: Date.now() + 3600 * 1000
            });
            await ExamControl.newExamReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Unauthorized');
        });
        test("Trying to create exam as a student", async () => {
            const req = new Request({ key: '999988887777666655554445', role: true });
            const res = new Response();
            req.setBody({
                name: 'utexam1223',
                duration: 20,
                start: Date.now(),
                end: Date.now() + 3600 * 1000
            });
            await ExamControl.newExamReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Access denied');
        });
        test("Trying to create without all parameters", async () => {
            const req = new Request({ key: '999988887777666655554444', role: false });
            const res = new Response();
            req.setBody({
                name: 'utexam1223',
                duration: 20
            });
            await ExamControl.newExamReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Insufficient params');
        });
    }
    TestdropExamReqPOST() {
        test("Request to delete exam", async () => {
            const req = new Request({ key: '999988887777666655554446', role: false });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            req.setBody({ id: mock._id });
            await ExamControl.dropExamReqPOST(req, res);
            expect(res.getSent().ok).toBe(true);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Delete exam without being logged in", async () => {
            const req = new Request();
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            req.setBody({ id: mock._id });
            await ExamControl.dropExamReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Unauthorized');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Trying to delete exam as a student", async () => {
            const req = new Request({ key: '999988887777666655554447', role: true });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554447');
            req.setBody({ id: mock._id });
            await ExamControl.dropExamReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Access denied');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Trying to delete exam created by another user", async () => {
            const req = new Request({ key: '999988887777666655554447', role: false });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '299988887777666655554446');
            req.setBody({ id: mock._id });
            await ExamControl.dropExamReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('No permission');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Delete exam with insufficient parameters", async () => {
            const req = new Request({ key: '999988887777666655554446', role: false });
            const res = new Response();
            req.setBody({});
            await ExamControl.dropExamReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Insufficient params');
        });
    }
    TestupdateExamReqPOST() {
        test("Request to update exam", async () => {
            const req = new Request({ key: '999988887777666655554446', role: false });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            req.setBody({
                id: mock._id,
                name: 'utexam1224',
                randomset: true,
                perset: 2,
                duration: 20,
                start: Date.now(),
                end: Date.now() + 3600 * 1000
            });
            await ExamControl.updateExamReqPOST(req, res);
            expect(res.getSent().ok).toBe(true);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Delete exam without being logged in", async () => {
            const req = new Request();
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            req.setBody({
                id: mock._id,
                name: 'utexam1224',
                randomset: true,
                perset: 2,
                duration: 20,
                start: Date.now(),
                end: Date.now() + 3600 * 1000
            });
            await ExamControl.updateExamReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Unauthorized');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Trying to update exam as a student", async () => {
            const req = new Request({ key: '999988887777666655554447', role: true });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554447');
            req.setBody({
                id: mock._id,
                name: 'utexam1224',
                randomset: true,
                perset: 2,
                duration: 20,
                start: Date.now(),
                end: Date.now() + 3600 * 1000
            });
            await ExamControl.updateExamReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Access denied');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Trying to update exam created by another user", async () => {
            const req = new Request({ key: '999988887777666655554447', role: false });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '299988887777666655554446');
            req.setBody({
                id: mock._id,
                name: 'utexam1224',
                randomset: true,
                perset: 2,
                duration: 20,
                start: Date.now(),
                end: Date.now() + 3600 * 1000
            });
            await ExamControl.updateExamReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('No permission');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Update exam with insufficient parameters", async () => {
            const req = new Request({ key: '999988887777666655554446', role: false });
            const res = new Response();
            req.setBody({});
            await ExamControl.updateExamReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Insufficient params');
        });
    }
    TestaddQuesReqPOST() {
        test("Request to add ques to exam", async () => {
            const req = new Request({ key: '999988887777666655554446', role: false });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            const ques = new QuesTemplate(mock._id);
            req.setBody({
                examid: ques.belongsTo,
                head: ques.headText,
                checkbox: ques.checkbox,
                points: ques.points,
                attempts: ques.attempts,
                options: ques.options
            });
            await ExamControl.addQuesReqPOST(req, res);
            expect(res.getSent().ok).toBe(true);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Add ques to exam without being logged in", async () => {
            const req = new Request();
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            const ques = new QuesTemplate(mock._id);
            req.setBody({
                examid: ques.belongsTo,
                head: ques.headText,
                checkbox: ques.checkbox,
                points: ques.points,
                attempts: ques.attempts,
                options: ques.options
            });
            await ExamControl.addQuesReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Unauthorized');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Trying to add ques to exam as a student", async () => {
            const req = new Request({ key: '999988887777666655554447', role: true });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            const ques = new QuesTemplate(mock._id);
            req.setBody({
                examid: ques.belongsTo,
                head: ques.headText,
                checkbox: ques.checkbox,
                points: ques.points,
                attempts: ques.attempts,
                options: ques.options
            });
            await ExamControl.addQuesReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Access denied');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Trying to add ques to exam created by another user", async () => {
            const req = new Request({ key: '999988887777666655554447', role: false });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            const ques = new QuesTemplate(mock._id);
            req.setBody({
                examid: ques.belongsTo,
                head: ques.headText,
                checkbox: ques.checkbox,
                points: ques.points,
                attempts: ques.attempts,
                options: ques.options
            });
            await ExamControl.addQuesReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('No permission');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Add ques to exam with insufficient parameters", async () => {
            const req = new Request({ key: '999988887777666655554446', role: false });
            const res = new Response();
            req.setBody({});
            await ExamControl.addQuesReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Insufficient params');
        });
    }
    TestdelQuesReqPOST() {
        test("Request to delete question from exam", async () => {
            const req = new Request({ key: '999988887777666655554446', role: false });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            const ques = await examData.createMockQues(mock._id);
            req.setBody({
                quesid: ques._id,
                examid: mock._id
            });
            await ExamControl.delQuesReqPOST(req, res);
            expect(res.getSent().ok).toBe(true);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Delete question from exam without being logged in", async () => {
            const req = new Request();
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            const ques = await examData.createMockQues(mock._id);
            req.setBody({
                quesid: ques._id,
                examid: mock._id
            });
            await ExamControl.delQuesReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Unauthorized');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Trying to delete question from exam as a student", async () => {
            const req = new Request({ key: '999988887777666655554447', role: true });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            const ques = await examData.createMockQues(mock._id);
            req.setBody({
                quesid: ques._id,
                examid: mock._id
            });
            await ExamControl.delQuesReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Access denied');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Trying to delete question from exam created by another user", async () => {
            const req = new Request({ key: '999988887777666655554447', role: false });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            const ques = await examData.createMockQues(mock._id);
            req.setBody({
                quesid: ques._id,
                examid: mock._id
            });
            await ExamControl.delQuesReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('No permission');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Delete question from exam with insufficient parameters", async () => {
            const req = new Request({ key: '999988887777666655554446', role: false });
            const res = new Response();
            req.setBody({});
            await ExamControl.delQuesReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Insufficient params');
        });
    }
    TesteditExamReqGET() {
        test("Request to get edit page of an exam", async () => {
            const req = new Request({ key: '999988887777666655554446', role: false });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            req.setQuery({ id: mock._id });
            await ExamControl.editExamReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*examedit\.ejs/g);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Get edit page of an exam without being logged in", async () => {
            const req = new Request();
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            req.setQuery({ id: mock._id });
            await ExamControl.editExamReqGET(req, res);
            expect(res.method).toBe(REDIRECT);
            expect(res.getRedirected()).toBe('/login');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Trying to get edit page of an exam as a student", async () => {
            const req = new Request({ key: '999988887777666655554447', role: true });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            req.setQuery({ id: mock._id });
            await ExamControl.editExamReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*exammsg\.ejs/g);
            expect(res.getRendered().data.data).toBe('Forbidden request');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Trying to get edit page of an exam created by another user", async () => {
            const req = new Request({ key: '999988887777666655554447', role: false });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            req.setQuery({ id: mock._id });
            await ExamControl.editExamReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*exammsg\.ejs/g);
            expect(res.getRendered().data.data).toBe('You do not have permission to edit this page');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Get edit page of an exam with insufficient parameters", async () => {
            const req = new Request({ key: '999988887777666655554446', role: false });
            const res = new Response();
            req.setQuery({});
            await ExamControl.editExamReqGET(req, res);
            expect(res.getRendered().path).toMatch(/.*exammsg\.ejs/g);
            expect(res.getRendered().data.data).toBe('Insufficient params');
        });
    }
    TestgetExamHistory() {
        test("Get exams created by user - multiple", async () => {
            for (let i = 0; i < 3; i++) await examData.createMockExam(false, 3, false, '999988887777666655550001');
            const actResult = await ExamControl.getExamHistory('999988887777666655550001');
            expect(actResult.length).toBeGreaterThan(0);
            await ExamModel.deleteMany({ createdBy: '999988887777666655550001' });
        });
        test("Get exams created by user - zero", async () => {
            const actResult = await ExamControl.getExamHistory('999988887777666655550002');
            expect(actResult.length).toBe(0);
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
    this.windowStart = "2021-05-10T22:50:22.104Z";
    this.windowEnd = "2021-05-10T23:50:22.104Z";
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
        { "label": "nc a", "correct": true  },
        { "label": "nc b", "correct": false }
    ];
}

const examData = {
    createMockExam: async (makeQues, count, set, owner) => {
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
    }
};

module.exports = ExamControlTest;