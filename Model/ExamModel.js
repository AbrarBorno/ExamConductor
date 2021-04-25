const mongoose  = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const { QuesModelOperation } = require('./QuesModel');
const { ResultDB } = require('../utils/general');
const { Exam } = require('../Controller/classes');

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

const examSchema = new mongoose.Schema({
    name:        String,
    duration:    Number,
    windowStart: Date,
    windowEnd:   Date,
    randomSet:   {
        type: Boolean,
        default: false
    },
    setFilterCount: {
        type: Number,
        default: 0
    },
    createdBy: ObjectId,
    questions: [ObjectId]
});

const ExamModel = mongoose.model('Exam', examSchema);

class ExamModelOperation {
    static async createExam(authorID, name, duration, windowStart, windowEnd) {
        try {
            const exam = new ExamModel({
                name:        name,
                duration:    duration,
                windowStart: windowStart,
                windowEnd:   windowEnd,
                createdBy:   authorID,
                questions:   []
            });
            const insertion = await exam.save();
            return new ResultDB(true, true, "OK", ExamModelOperation._makeFromModel(insertion));
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async updateExam(examID, name, duration, windowStart, windowEnd, setBased, quesPerSet) {
        try {
            const findDoc = await ExamModel.findById(examID).exec();
            if(findDoc === null) return new ResultDB(true, false, "Failed to update, exam not found", null);
            if(setBased && findDoc.questions.length < quesPerSet) return new ResultDB(true, false, "Invalid question limit", null);
            findDoc.name = name;
            findDoc.duration = duration;
            findDoc.windowStart = windowStart;
            findDoc.windowEnd = windowEnd;
            findDoc.randomSet = setBased;
            findDoc.setFilterCount = quesPerSet;
            const insertion = await findDoc.save();
            return new ResultDB(true, true, "OK", ExamModelOperation._makeFromModel(insertion));
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async insertQues(examID, headText, checkbox, points, attempts, options) {
        try {
            const quesIns = await QuesModelOperation.addNewQues(examID, headText, checkbox, points, attempts, options);
            if(!quesIns.queryOK) return quesIns;
            if(!quesIns.isOK) return quesIns;
            const findDoc = await ExamModel.findById(examID).exec();
            if(findDoc === null) return new ResultDB(true, false, "Failed to update, exam not found", null);
            findDoc.questions.push(quesIns.load._id);
            await findDoc.save();
            return quesIns;
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async updateQues(quesID, headText, checkbox, points, attempts, options) {
        return await QuesModelOperation.updateQues(quesID, headText, checkbox, points, attempts, options);
    }

    static async delQues(examID, quesID) {
        try {
            const quesIns = await QuesModelOperation.deleteQues(quesID);
            if(!quesIns.queryOK) return quesIns;
            if(!quesIns.isOK) return quesIns;
            const findDoc = await ExamModel.findById(examID).exec();
            if(findDoc === null) return new ResultDB(true, false, "Failed to update, exam not found", null);
            findDoc.questions = findDoc.questions.filter(val => !val.equals(quesID));
            if(findDoc.questions.length < findDoc.setFilterCount) {
                findDoc.randomSet = false;
                findDoc.setFilterCount = -1;
            }
            await findDoc.save();
            return quesIns;
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async getAllQues(examID) {
        try {
            const findDoc = await ExamModel.findById(examID).exec();
            if(findDoc === null)
                return new ResultDB(true, false, "Unable to get question, exam not found", null);
            return await QuesModelOperation.findMany(findDoc.questions);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async dropExam(examID) {
        try {
            const quesIns = await QuesModelOperation.delMutiple(examID);
            if(!quesIns.queryOK) return quesIns;
            if(!quesIns.isOK) return quesIns;
            const delQuery = await ExamModel.findByIdAndDelete(examID, { useFindAndModify: false }).exec();
            return new ResultDB(true, delQuery !== null, null, null);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async makeQuesSet(examID) {
        try {
            const findDoc = await ExamModel.findById(examID).exec();
            if(findDoc === null)
                return new ResultDB(true, false, "Unable to get question, exam not found", null);
            if(findDoc.randomSet && findDoc.questions.length < findDoc.setFilterCount)
                return new ResultDB(true, false, "Error processing questions", null);
            let idx = [...findDoc.questions];
            if(findDoc.randomSet && findDoc.setFilterCount > 0) {
                shuffleArray(idx);
                idx = idx.slice(0, findDoc.setFilterCount);
            }
            return await QuesModelOperation.findMany(idx);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async getShortInfo(examID) {
        try {
            const findDoc = await ExamModel.findById(examID).exec();
            if(findDoc === null)
                return new ResultDB(true, false, "Exam not found", null);
            const info = ExamModelOperation._makeFromModel(findDoc);
            return new ResultDB(true, true, "OK", info);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async getCreatedExams(userID) {
        try {
            const exams = await ExamModel.find({ createdBy: userID }, { name: 1 }).exec();
            if(exams === null)
                return new ResultDB(true, false, "Exam not found", null);
            const mapped = exams.map(val => ExamModelOperation._makeFromModel(val));
            return new ResultDB(true, true, "OK", mapped);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async getExamFull(examID) {
        try {
            const findDoc = await ExamModel.findById(examID).exec();
            if(findDoc === null) return new ResultDB(true, false, "Exam not found", null);
            const info = ExamModelOperation._makeFromModel(findDoc);
            const resques = await QuesModelOperation.findMany(info.quesPool);
            if(!resques.isOK) { return resques; }
            info.quesPool = resques.load;
            return new ResultDB(true, true, "OK", info);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static _makeFromModel(model) {
        const obj = new Exam(
            model.name,
            model.windowStart,
            model.windowEnd,
            model.duration,
            model.randomSet,
            model.setFilterCount,
            model.questions,
            model.createdBy
        );
        obj._id = model._id;
        return obj;
    }
}

module.exports = { ExamModel, ExamModelOperation };