const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const { ExamModel, ExamModelOperation } = require('../Model/ExamModel');
const { QuesModel, QuesModelOperation } = require('../Model/QuesModel');

const Test = require('./helpers/Test');

class ExamModelOperationTest extends Test {
    TestcreateExam() {
        test("Create an exam", async () => {
            const actResult = await ExamModelOperation.createExam("6099b5f57ad90c2220ee0f72", "Exam9285", 15, Date.now(), Date.now() + 3600000);
            const query = await ExamModel.find({ name: "Exam9285" });
            expect(actResult.isOK).toBe(true);
            expect(query.length).toBeGreaterThan(0);
            await ExamModel.deleteMany({ name: "Exam9285" });
        });
    }
    TestupdateExam() {
        test("Update an existing exam", async () => {
            const mock = await examData.createMockExam(true);
            const actResult = await ExamModelOperation.updateExam(mock._id, "Updated", 30, Date.now(), Date.now() + 3600000, true, 2);
            const query = await ExamModel.findById(mock._id);
            expect(actResult.isOK).toBe(true);
            expect(query.name).toBe("Updated");
            expect(query.duration).toBe(30);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Setting ques per set more than actual number of ques", async () => {
            const mock = await examData.createMockExam(true);
            const actResult = await ExamModelOperation.updateExam(mock._id, "Updated", 30, Date.now(), Date.now() + 3600000, true, 9);
            const query = await ExamModel.findById(mock._id);
            expect(actResult.isOK).toBe(false);
            expect(actResult.msg).toBe("Invalid question limit");
            expect(query.name).toBe(mock.name);
            expect(query.duration).toBe(mock.duration);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Updating non-existent exam", async () => {
            const actResult = await ExamModelOperation.updateExam("7659b5f57ad90c2220ee0f72", "Updated", 30, Date.now(), Date.now() + 3600000, true, 2);
            expect(actResult.isOK).toBe(false);
            expect(actResult.msg).toBe("Failed to update, exam not found");
        });
    }
    TestinsertQues() {
        test("Insert question into an exam", async () => {
            const mock = await examData.createMockExam(false);
            const actResult = await ExamModelOperation.insertQues(mock._id, "iques_head_1", true, 1, 1, [{ label: "nc a", correct: true }]);
            const query1 = await ExamModel.findById(mock._id);
            const query2 = await QuesModel.find({ belongsTo: mock._id });
            expect(actResult.isOK).toBe(true);
            expect(query1.questions.length).toBe(1);
            expect(query2.length).toBe(1);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Insert ques into non-existent exam", async () => {
            const actResult = await ExamModelOperation.insertQues("7659b5f57ad90c2220ee0f72", "iques_head_2", true, 1, 1, [{ label: "nc a", correct: true }]);
            expect(actResult.isOK).toBe(false);
            await QuesModel.deleteMany({ belongsTo: "7659b5f57ad90c2220ee0f72" });
        });
    }
    TestdelQues() {
        test("Update existing question", async () => {
            const mock = await examData.createMockExam(true);
            const actResult = await ExamModelOperation.delQues(mock._id, mock.questions[1]._id);
            const query1 = await ExamModel.findById(mock._id);
            const query2 = await QuesModel.find({ belongsTo: mock._id });
            expect(actResult.isOK).toBe(true);
            expect(query1.questions.length).toBe(2);
            expect(query2.length).toBe(2);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Updating non-existent question", async () => {
            const mock = await examData.createMockQues("7659b5f57ad90c2220ee0f72");
            const actResult = await ExamModelOperation.delQues("7659b5f57ad90c2220ee0f72", mock._id);
            expect(actResult.isOK).toBe(false);
            await QuesModel.deleteMany({ belongsTo: "7659b5f57ad90c2220ee0f72" });
        });
    }
    TestupdateQues() {
        test("Delete question from existing exam", async () => {
            await new QuesModel(examData.ques1).save();
            const { quesID, headText, checkbox, points, attempts, options } = examData.ques1update;
            const actResult = await QuesModelOperation.updateQues(quesID, headText, checkbox, points, attempts, options);
            const query = await QuesModel.findById(quesID);
            expect(actResult.isOK).toBe(true);
            expect(query.headText).toBe(headText);
            expect(query.checkbox).toBe(checkbox);
            expect(query.points).toBe(points);
            expect(query.attempts).toBe(attempts);
            await QuesModel.deleteMany({ _id: quesID });
        });
        test("Delete question from non existent exam", async () => {
            const { headText, checkbox, points, attempts, options } = examData.ques1update;
            const quesID = '6098a2a34dc18915cc9f2cf0';
            const actResult = await QuesModelOperation.updateQues(quesID, headText, checkbox, points, attempts, options);
            expect(actResult.isOK).toBe(false);
        });
    }
    TestgetAllQues() {
        test("Get All question from existing exam", async () => {
            const mock = await examData.createMockExam(true);
            const actResult = await ExamModelOperation.getAllQues(mock._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load.length).toBe(mock.questions.length);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Get All question from non-existent exam", async () => {
            const actResult = await ExamModelOperation.getAllQues("7659b5f57ad90c2220ee0f72");
            expect(actResult.isOK).toBe(false);
        });
    }
    TestdropExam() {
        test("Delete an existing exam", async () => {
            const mock = await examData.createMockExam(false);
            const actResult = await ExamModelOperation.dropExam(mock._id);
            const query = await ExamModel.findById(mock._id);
            expect(actResult.isOK).toBe(true);
            expect(query).toBeFalsy();
        });
        test("Delete an non-existent exam", async () => {
            const actResult = await ExamModelOperation.dropExam("7659b5f57ad90c2220ee0f72");
            expect(actResult.isOK).toBe(false);
        });
    }
    TestmakeQuesSet() {
        test("Sort questions without making set", async () => {
            const mock = await examData.createMockExam(true, 3, false);
            const actResult = await ExamModelOperation.makeQuesSet(mock._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load.length).toBe(3);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Sort questions by making set", async () => {
            const mock = await examData.createMockExam(true, 2, true);
            const actResult = await ExamModelOperation.makeQuesSet(mock._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load.length).toBe(2);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Sort questions from non-existent exam", async () => {
            const actResult = await ExamModelOperation.makeQuesSet("7659b5f57ad90c2220ee0f72");
            expect(actResult.isOK).toBe(false);
        });
    }
    TestgetShortInfo() {
        test("Get metadata of an existing exam", async () => {
            const mock = await examData.createMockExam(false);
            const actResult = await ExamModelOperation.getShortInfo(mock._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load.name).toBe(mock.name);
            expect(actResult.load.duration).toBe(mock.duration);
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Get metadata of an non-existent exam", async () => {
            const actResult = await ExamModelOperation.getShortInfo("7659b5f57ad90c2220ee0f72");
            expect(actResult.isOK).toBe(false);
        });
    }
    TestgetExamFull() {
        test("Get full exam data of an existing exam", async () => {
            const mock = await examData.createMockExam(true);
            const actResult = await ExamModelOperation.getExamFull(mock._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load.name).toBe(mock.name);
            expect(actResult.load.duration).toBe(mock.duration);
            expect(actResult.load.quesPool.length).toBe(mock.questions.length);
            await QuesModel.deleteMany({ belongsTo: mock._id });
            await ExamModel.deleteMany({ _id: mock._id });
        });
        test("Get full exam data of an non-existent exam", async () => {
            const actResult = await ExamModelOperation.getExamFull("7659b5f57ad90c2220ee0f72");
            expect(actResult.isOK).toBe(false);
        });
    }
    TestgetCreatedExams() {
        test("Get all exams composed by a user", async () => {
            for (let i = 0; i < 3; i++) await examData.mockExamAuthor("8744b5f57ad90c2220ee0f55");
            const actResult = await ExamModelOperation.getCreatedExams("8744b5f57ad90c2220ee0f55");
            expect(actResult.isOK).toBe(true);
            expect(actResult.load.length).toBe(3);
            await ExamModel.deleteMany({ createdBy: "8744b5f57ad90c2220ee0f55" });
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
        { "label": "nc a", "correct": true },
        { "label": "nc b", "correct": false }
    ];
}

const examData = {
    createMockExam: async (makeQues, count, set) => {
        const exam = new Template();
        if (makeQues) {
            for (let i = 0; i < 3; i++) {
                const temp = new QuesModel(new QuesTemplate(exam._id));
                await temp.save();
                exam.questions.push(temp._id);
            }
            exam.setFilterCount = count || 3;
            exam.randomSet = set || false;
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
    },
    ques1: {
        _id: "666666666666633333333333",
        belongsTo: "60661cf100cf94247c2c3b51",
        headText: "Ques2866994",
        checkbox: false,
        points: 4,
        attempts: 2,
        options: [
            { "label": "nc a", "correct": true },
            { "label": "nc b", "correct": false }
        ]
    },
    ques1update: {
        quesID: "666666666666633333333333",
        headText: "Ques with valid title",
        checkbox: true,
        points: 3,
        attempts: 3,
        options: [
            { label: "nc a", correct: true },
            { label: "nc b", correct: false },
            { label: "nc c", correct: true }
        ]
    }
};

module.exports = ExamModelOperationTest;