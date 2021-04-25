const mongoose  = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const { ResultDB } = require('../utils/general');
const { QuestionMCQ, QuestionCheckbox } = require('../Controller/classes');

const quesSchema = new mongoose.Schema({
    belongsTo: ObjectId,
    headText: String,
    checkbox: Boolean,
    points:   Number,
    attempts: Number,
    options: [
        {
            label:    String,
            correct:  Boolean
        }
    ]
});

const QuesModel = mongoose.model('Ques', quesSchema);

class QuesModelOperation {
    static async addNewQues(examID, headText, checkbox, points, attempts, options) {
        if(!Array.isArray(options)) {
            return new ResultDB(false, false, "options is not an array", null);
        }
        for (let i = 0; i < options.length; i++) {
            const opt = options[i];
            if(!(opt.hasOwnProperty('label') && opt.hasOwnProperty('correct'))) {
                return new ResultDB(false, false, "malformed question options", null);
            }
        }
        try {
            const ques = new QuesModel({
                belongsTo: examID,
                headText: headText,
                checkbox: checkbox,
                points: points,
                attempts: attempts,
                options: options
            });
            const saveQuery = await ques.save();
            const quesObj = QuesModelOperation._mapFromModel(saveQuery);
            return new ResultDB(true, quesObj !== null, quesObj !== null ? "OK" : "Failure processing", quesObj);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async updateQues(quesID, headText, checkbox, points, attempts, options) {
        if(!Array.isArray(options)) {
            return new ResultDB(false, false, "options is not an array", null);
        }
        for (let i = 0; i < options.length; i++) {
            const opt = options[i];
            if(!(opt.hasOwnProperty('label') && opt.hasOwnProperty('correct'))) {
                return new ResultDB(false, false, "malformed question options", null);
            }
        }
        try {
            const updtQues = await QuesModel.findByIdAndUpdate(quesID, {
                headText: headText,
                checkbox: checkbox,
                points: points,
                attempts: attempts,
                options: options
            }, { useFindAndModify: false, new: true }).exec();
            if(updtQues !== null) {
                const quesObj = QuesModelOperation._mapFromModel(updtQues);
                return new ResultDB(true, quesObj !== null, quesObj !== null ? "OK" : "Failure processing", quesObj);
            } else {
                return new ResultDB(true, false, "Ques was not found", null);
            }
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async deleteQues(quesID) {
        try {
            const delQuery = await QuesModel.findByIdAndDelete(quesID, { useFindAndModify: false }).exec();
            return new ResultDB(true, delQuery !== null, null, null);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async delMutiple(examID) {
        try {
            const delQuery = await QuesModel.deleteMany({ belongsTo: examID }).exec();
            return new ResultDB(true, !!delQuery.ok, null, null);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async findOne(quesID) {
        try {
            const ques = await QuesModel.findById(quesID).exec();
            if(ques !== null) {
                return new ResultDB(true, true, "OK", QuesModelOperation._mapFromModel(ques));
            } else {
                return new ResultDB(true, false, "Error processing ques", null);
            }
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async findMany(ids) {
        try {
            const filtered = await QuesModel.find().where('_id').in(ids).exec();
            return new ResultDB(true, true, "OK", filtered.map(val => QuesModelOperation._mapFromModel(val)));
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static _mapFromModel(model) {
        const corr = model.options.map((val, idx) => val.correct ? idx : -1).filter(val => val >= 0);
        const opts = model.options.map(val => val.label);
        if(corr.length === 0 || opts.length === 0) return null;
        if(model.checkbox) {
            // points, questionText, options, attempts, correctIndexes
            const ques = new QuestionCheckbox(
                model.points,
                model.headText,
                opts,
                model.attempts,
                corr
            );
            ques._id = model._id;
            return ques;
        } else {
            // points, questionText, options, attempts, correctIndex
            const ques = new QuestionMCQ(
                model.points,
                model.headText,
                opts,
                model.attempts,
                corr
            );
            ques._id = model._id;
            return ques;
        }
    }
}

module.exports = { QuesModel, QuesModelOperation };