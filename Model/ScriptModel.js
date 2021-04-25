const mongoose  = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const { ResultDB } = require('../utils/general');
const { ExamModel, ExamModelOperation } = require('./ExamModel');
const { UserModel } = require('./UserModel');
const { QuesModelOperation } = require('./QuesModel');
const { AnswerScript } = require('../Controller/classes');

const scriptSchema = new mongoose.Schema({
    submittedBy: ObjectId,
    examModel:   ObjectId,
    startTime:   Date,
    finished:    Boolean,
    answers: [
        {
            quesID: ObjectId,
            selected: [Number],
            attempts: Number
        }
    ]
});

const ScriptModel = mongoose.model('AnswerScript', scriptSchema);

class ScriptModelOperation {
    static async makeScript(ownerID, examID) {
        try {
            const quesSet = await ExamModelOperation.makeQuesSet(examID);
            if(!quesSet.queryOK) return quesSet;
            if(!quesSet.isOK) return quesSet;
            const time = new Date();
            const ascript = new ScriptModel({
                submittedBy: ownerID,
                examModel: examID,
                startTime: time,
                finished: false,
                answers: quesSet.load.map(val => {
                    return {
                        quesID: val._id,
                        selected: [],
                        attempts: val.attempts
                    };
                })
            });
            await ascript.save();
            const scriptObj = new AnswerScript(
                ownerID,
                time,
                false,
                quesSet.load,
                examID
            );
            scriptObj._id = ascript._id;
            return new ResultDB(true, true, "OK", scriptObj);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async doesScriptExist(ownerID, examID) {
        try {
            const ascriptQuery = await ScriptModel.find({ submittedBy: ownerID, examModel: examID }).exec();
            return new ResultDB(true, true, "OK", ascriptQuery.length > 0);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async getScriptInfo(ownerID, examID) {
        try {
            const ascriptQuery = await ScriptModel.find({ submittedBy: ownerID, examModel: examID }).exec();
            if(ascriptQuery.length > 0) {
                const ascript = ascriptQuery[0];
                const scriptObj = new AnswerScript(
                    ascript.submittedBy,
                    ascript.startTime,
                    ascript.finished,
                    null,
                    ascript.examModel
                );
                scriptObj._id = ascript._id;
                delete scriptObj.sortedQues;
                return new ResultDB(true, true, "OK", scriptObj);
            } else {
                return new ResultDB(true, false, "Student script not found", null);
            }
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async getScript(ownerID, examID) {
        try {
            const ascriptQuery = await ScriptModel.find({ submittedBy: ownerID, examModel: examID }).exec();
            if(ascriptQuery.length > 0) {
                const ascript = ascriptQuery[0];
                if(ascript === null) {
                    return new ResultDB(true, false, "Failed to get answer script", null);
                }
                const ids = ascript.answers.map(val => val.quesID);
                const quesSet = await QuesModelOperation.findMany(ids);
                const scriptObj = new AnswerScript(
                    ascript.submittedBy,
                    ascript.startTime,
                    ascript.finished,
                    quesSet.load,
                    ascript.examModel
                );
                scriptObj._id = ascript._id;
                scriptObj.attempts = ascript.answers;
                return new ResultDB(true, true, "OK", scriptObj);
            } else {
                return new ResultDB(true, false, "Student script not found", null);
            }
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async getSubmissionMult(examID) {
        try {
            const scripts = await ScriptModel.find(
                { examModel: examID },
                { submittedBy: 1, startTime: 1, answers: 1 }
            ).exec();
            const students = await UserModel.find(
                { _id: { $in: scripts.map(val => val.submittedBy) } },
                { userName: 1, studentID: 1 }
            ).exec();
            const map = new Map();
            const merged = [];
            students.forEach(val => map.set(String(val._id), val));
            scripts.forEach(val => {
                let key = String(val.submittedBy);
                if(map.has(key)) {
                    let stdnt = map.get(key);
                    merged.push({
                        stid: stdnt._id,
                        studentID: stdnt.studentID,
                        userName: stdnt.userName,
                        answers: val.answers
                    });
                }
            });
            return new ResultDB(true, true, "OK", merged);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async getSubmission(userID) {
        try {
            const scripts = await ScriptModel.find(
                { submittedBy: userID },
                { examModel: 1 }
            ).exec();
            const exams = await ExamModel.find(
                { _id: { $in: scripts.map(val => val.examModel) } },
                { name: 1, windowStart: 1, windowEnd: 1 }
            ).exec();
            const map = new Map();
            const merged = [];
            exams.forEach(val => map.set(String(val._id), val));
            scripts.forEach(val => {
                let key = String(val.examModel);
                if(map.has(key)) {
                    let exm = map.get(key);
                    merged.push({
                        name: exm.name,
                        windowStart: exm.windowStart,
                        windowEnd: exm.windowEnd,
                        id: exm._id
                    });
                }
            });
            return new ResultDB(true, true, "OK", merged);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async getAttemptsInfo(scriptID) {
        try {
            const ascript = await ScriptModel.findById(scriptID).exec();
            if(ascript === null) {
                return new ResultDB(true, false, "Failed to get answer script", null);
            }
            return new ResultDB(true, true, "OK", [...ascript.answers]);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async attemptQues(scriptID, quesID, selected) {
        try {
            const ascript = await ScriptModel.findById(scriptID).exec();
            if(ascript === null) {
                return new ResultDB(true, false, "Failed to attempt question", null);
            }
            let found = null;
            for (let i = 0; i < ascript.answers.length; i++) {
                if(ascript.answers[i].quesID.equals(quesID)) {
                    found = ascript.answers[i];
                    break;
                }
            }
            if(found !== null) {
                if(found.attempts !== 0) {
                    found.selected = selected;
                    found.attempts--;
                    await ascript.save();
                    return new ResultDB(true, true, "OK", null);
                } else {
                    return new ResultDB(true, false, "Maximum attempts reached", null);
                }
            } else {
                return new ResultDB(true, false, "Failed to attempt question", null);
            }
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async endExamScript(scriptID) {
        try {
            const upQuery = await ScriptModel.findByIdAndUpdate(scriptID, { finished: true }, { useFindAndModify: false, new: true }).exec();
            return new ResultDB(true, upQuery !== null, upQuery !== null ? "OK" : "Failed to end exam", null);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async getAllScriptsUnderExam(examID) {
        try {
            const scripts = await ScriptModel.find({ examModel: examID }, { submittedBy: 1, startTime: 1 }).exec();
            return new ResultDB(true, true, "OK", scripts);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async dropScripts(examID) {
        try {
            await ScriptModel.deleteMany({ examModel: examID }).exec();
            return new ResultDB(true, true, "OK", null);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }
}


module.exports = { ScriptModel, ScriptModelOperation };