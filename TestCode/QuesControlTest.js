const { Request, Response, SEND, RENDER, REDIRECT } = require('./helpers/utils');
const QuesControl = require('../Controller/QuesControl');
const { ExamModel } = require('../Model/ExamModel');
const { QuesModel } = require('../Model/QuesModel');
const mongoose  = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Test = require('./helpers/Test');

class QuesControlTest extends Test {
    TestupdtQuesReqPOST() {
        test("Request to update question of an exam", async () => {
            const req = new Request({ key: '999988887777666655554446', role: false });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            const ques = await examData.createMockQues(mock._id);
            req.setBody({
                quesid: ques._id,
                examid: mock._id,
                head: "Updated title",
                checkbox: true,
                points: 3,
                attempts: 6,
                options: [{ label: "nc a", correct: true  }]
            });
            await QuesControl.updtQuesReqPOST(req, res);
            expect(res.getSent().ok).toBe(true);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Update question of an exam without being logged in", async () => {
            const req = new Request();
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            const ques = await examData.createMockQues(mock._id);
            req.setBody({
                quesid: ques._id,
                examid: mock._id,
                head: "Updated title",
                checkbox: true,
                points: 3,
                attempts: 6,
                options: ques.options
            });
            await QuesControl.updtQuesReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Unauthorized');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Trying to update question of an exam as a student", async () => {
            const req = new Request({ key: '999988887777666655554447', role: true });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            const ques = await examData.createMockQues(mock._id);
            req.setBody({
                quesid: ques._id,
                examid: mock._id,
                head: "Updated title",
                checkbox: true,
                points: 3,
                attempts: 6,
                options: ques.options
            });
            await QuesControl.updtQuesReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Access denied');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Trying to update question of an exam created by another user", async () => {
            const req = new Request({ key: '999988887777666655554447', role: false });
            const res = new Response();
            const mock = await examData.createMockExam(true, 3, false, '999988887777666655554446');
            const ques = await examData.createMockQues(mock._id);
            req.setBody({
                quesid: ques._id,
                examid: mock._id,
                head: "Updated title",
                checkbox: true,
                points: 3,
                attempts: 6,
                options: ques.options
            });
            await QuesControl.updtQuesReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('No permission');
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Update question of an exam with insufficient parameters", async () => {
            const req = new Request({ key: '999988887777666655554446', role: false });
            const res = new Response();
            req.setBody({});
            await QuesControl.updtQuesReqPOST(req, res);
            expect(res.method).toBe(SEND);
            expect(res.getSent().ok).toBe(false);
            expect(res.getSent().msg).toBe('Insufficient params');
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
            exam.createdBy = owner || "6099b5f57ad90c2220ee0f72";
        }
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

module.exports = QuesControlTest;