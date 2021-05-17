const mongoose  = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const { UserModel, UserModelOperation } = require('../Model/UserModel');
const { ExamModel, ExamModelOperation } = require('../Model/ExamModel');
const { QuesModel, QuesModelOperation } = require('../Model/QuesModel');
const { ScriptModel, ScriptModelOperation } = require('../Model/ScriptModel');

const Test = require('./helpers/Test');

class ScriptModelOperationTest extends Test {
    TestmakeScript() {
        test("Generate Answerscript of existing exam", async () => {
            const exam = await scriptData.createMockExam(true);
            const actResult = await ScriptModelOperation.makeScript("aaaa88886666444422220000", exam._id);
            const query = await ScriptModel.find({ examModel: exam._id });
            expect(actResult.isOK).toBe(true);
            expect(query.length).toBeGreaterThan(0);
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
            await ScriptModel.deleteMany({ examModel: exam._id });
        });
        test("Generate Answerscript of non-existent exam", async () => {
            const actResult = await ScriptModelOperation.makeScript("aaaa88886666444422220000", "bbbb99997777555533331111");
            expect(actResult.isOK).toBe(false);
        });
    }
    TestdoesScriptExist() {
        test("Script exists for an exam of a user", async () => {
            const exam = await scriptData.createMockExam(true);
            const mock = await scriptData.createMockScript(exam, "aaaa88886666444422220000");
            const actResult = await ScriptModelOperation.doesScriptExist("aaaa88886666444422220000", exam._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load).toBe(true);
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
            await ScriptModel.deleteMany({ examModel: exam._id });
        });
        test("Script does not exist for an exam of a user", async () => {
            const exam = await scriptData.createMockExam(true);
            const actResult = await ScriptModelOperation.doesScriptExist("eeee88886666444422220000", exam._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load).toBe(false);
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
        });
    }
    TestgetScriptInfo() {
        test("Existent script metadata", async () => {
            const exam = await scriptData.createMockExam(true);
            const mock = await scriptData.createMockScript(exam, "aaaa88886666444422220001");
            const actResult = await ScriptModelOperation.getScriptInfo(mock.submittedBy, exam._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load).toBeTruthy();
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
            await ScriptModel.deleteMany({ examModel: exam._id });
        });
        test("Non-existent script metadata", async () => {
            const exam = await scriptData.createMockExam(true);
            const actResult = await ScriptModelOperation.getScriptInfo("aaaa88886666444422220002", exam._id);
            expect(actResult.isOK).toBe(false);
            expect(actResult.load).toBeFalsy();
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
        });
    }
    TestgetScript() {
        test("Existent script fullbody", async () => {
            const exam = await scriptData.createMockExam(true);
            const mock = await scriptData.createMockScript(exam, "aaaa88886666444422220003");
            const actResult = await ScriptModelOperation.getScript(mock.submittedBy, exam._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load).toBeTruthy();
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
            await ScriptModel.deleteMany({ examModel: exam._id });
        });
        test("Non-existent script fullbody", async () => {
            const exam = await scriptData.createMockExam(true);
            const actResult = await ScriptModelOperation.getScript("aaaa88886666444422220004", exam._id);
            expect(actResult.isOK).toBe(false);
            expect(actResult.load).toBeFalsy();
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
        });
    }
    TestgetSubmissionMult() {
        test("Get multiple scripts submitted under an exam by multiple students", async () => {
            const user1 = new UserModel({ userName: "user1" }); await user1.save();
            const user2 = new UserModel({ userName: "user2" }); await user2.save();
            const exam = await scriptData.createMockExam(true);
            await scriptData.createMockScript(exam, user1._id);
            await scriptData.createMockScript(exam, user2._id);
            const actResult = await ScriptModelOperation.getSubmissionMult(exam._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load.length).toBe(2);
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
            await ScriptModel.deleteMany({ examModel: exam._id });
            await UserModel.deleteOne({ userName: "user1" });
            await UserModel.deleteOne({ userName: "user2" });
        });
    }
    TestgetSubmission() {
        test("Get multiple scripts submitted under multiple exams by one user", async () => {
            const user3 = new UserModel({ userName: "user3" }); await user3.save();
            const exam1 = await scriptData.createMockExam(true);
            const exam2 = await scriptData.createMockExam(true);
            await scriptData.createMockScript(exam1, user3._id);
            await scriptData.createMockScript(exam2, user3._id);
            const actResult = await ScriptModelOperation.getSubmission(user3._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load.length).toBe(2);
            await QuesModel.deleteMany({ belongsTo: exam1._id });
            await QuesModel.deleteMany({ belongsTo: exam2._id });
            await ExamModel.deleteMany({ _id: exam1._id });
            await ExamModel.deleteMany({ _id: exam2._id });
            await ScriptModel.deleteMany({ submittedBy: user3._id });
            await UserModel.deleteOne({ userName: "user3" });
        });
    }
    TestgetAttemptsInfo() {
        test("Get attempts info of an existing script", async () => {
            const exam = await scriptData.createMockExam(true);
            const mock = await scriptData.createMockScript(exam, "aaaa88886666444422220006");
            const actResult = await ScriptModelOperation.getAttemptsInfo(mock._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load.length).toBe(mock.answers.length);
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
            await ScriptModel.deleteMany({ examModel: exam._id });
        });
        test("Get attempts info of an non-existent script", async () => {
            const actResult = await ScriptModelOperation.getAttemptsInfo("6099b5f57ad90c2220ee0f72");
            expect(actResult.isOK).toBe(false);
        });
    }
    TestattemptQues() {
        test("Attempt a single question within limit", async () => {
            const exam = await scriptData.createMockExam(true);
            const mock = await scriptData.createMockScript(exam, "aaaa88886666444422220007");
            const actResult = await ScriptModelOperation.attemptQues(mock._id, exam.questions[0]._id, [0]);
            expect(actResult.isOK).toBe(true);
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
            await ScriptModel.deleteMany({ examModel: exam._id });
        });
        test("Attempt a single question from non-existent script", async () => {
            const exam = await scriptData.createMockExam(true);
            const actResult = await ScriptModelOperation.attemptQues("6099b5f57ad90c2220ee0f72", exam.questions[0]._id, [0]);
            expect(actResult.isOK).toBe(false);
            expect(actResult.msg).toBe("Failed to attempt question");
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
        });
        test("Attempt a single question out of limit", async () => {
            const exam = await scriptData.createMockExam(true);
            const mock = await scriptData.createMockScript(exam, "aaaa88886666444422220008");
            {
                const temp = await ScriptModel.findById(mock._id).exec();
                temp.answers[0].attempts = 0;
                await temp.save();
            }
            const actResult = await ScriptModelOperation.attemptQues(mock._id, exam.questions[0]._id, [0]);
            expect(actResult.isOK).toBe(false);
            expect(actResult.msg).toBe("Maximum attempts reached");
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
            await ScriptModel.deleteMany({ examModel: exam._id });
        });
    }
    TestendExamScript() {
        test("Mark existing script as finished", async () => {
            const exam = await scriptData.createMockExam(true);
            const mock = await scriptData.createMockScript(exam, "aaaa88886666444422220009");
            const actResult = await ScriptModelOperation.endExamScript(mock._id);
            const query = await ScriptModel.findById(mock._id);
            expect(actResult.isOK).toBe(true);
            expect(query.finished).toBe(true);
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
            await ScriptModel.deleteMany({ examModel: exam._id });
        });
        test("Mark non-existent script as finished", async () => {
            const exam = await scriptData.createMockExam(true);
            const actResult = await ScriptModelOperation.endExamScript("6099b5f57ad90c2220ee0f72");
            expect(actResult.isOK).toBe(false);
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
        });
    }
    TestgetAllScriptsUnderExam() {
        test("Get all scripts under an exam", async () => {
            const exam = await scriptData.createMockExam(true);
            const mock1 = await scriptData.createMockScript(exam, "aaaa88886666444422220010");
            const mock2 = await scriptData.createMockScript(exam, "aaaa88886666444422220011");
            const actResult = await ScriptModelOperation.getAllScriptsUnderExam(exam._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load.length).toBe(2);
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
            await ScriptModel.deleteMany({ examModel: exam._id });
        });
    }
    TestdropScripts() {
        test("Delete all scripts under an exam", async () => {
            const exam = await scriptData.createMockExam(true);
            const mock1 = await scriptData.createMockScript(exam, "aaaa88886666444422220012");
            const mock2 = await scriptData.createMockScript(exam, "aaaa88886666444422220013");
            const actResult = await ScriptModelOperation.dropScripts(exam._id);
            const query = await ScriptModel.find({ examModel: exam._id });
            expect(actResult.isOK).toBe(true);
            expect(query.length).toBe(0);
            await QuesModel.deleteMany({ belongsTo: exam._id });
            await ExamModel.deleteMany({ _id: exam._id });
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
    this.attempts = 1;
    this.options = [
        { label: "nc a", correct: true  },
        { label: "nc b", correct: false }
    ];
}

function ScriptTemplate(examObj, authorID) {
    this._id = new ObjectId();
    this.submittedBy = authorID;
    this.examModel = examObj._id;
    this.startTime = Date.now();
    this.finished = false;
    this.answers = examObj.questions.map(ques => { return { selected: [], quesID: ques, attempts: 2 } });
}

const scriptData = {
    createMockExam: async (makeQues, count, set) => {
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
        await new ExamModel(exam).save();
        return exam;
    },
    createMockScript: async (examObj, authorID) => {
        const doc = new ScriptModel(new ScriptTemplate(examObj, authorID));
        await doc.save();
        return doc;
    }
};

module.exports = ScriptModelOperationTest;