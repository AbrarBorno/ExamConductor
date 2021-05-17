const { QuesModel, QuesModelOperation } = require('../Model/QuesModel');
const Test = require('./helpers/Test');

class QuesModelOperationTest extends Test {
    TestaddNewQues() {
        test("Add a healthy question", async () => {
            const actResult = await QuesModelOperation.addNewQues(
                "60661cf100cf94247c2c3b51", "Ques2862998", false, 4, 2,
                [{ label: "nc a", correct: true }, { label: "nc b", correct: false }]
            );
            const query = await QuesModel.find({ headText: "Ques2862998" });
            expect(actResult.isOK).toBe(true);
            expect(query.length).toBeGreaterThan(0);
            await QuesModel.deleteMany({ headText: "Ques2862998" });
        });
        test("Malformed question, no options", async () => {
            const actResult = await QuesModelOperation.addNewQues(
                "60661cf100cf94247c2c3b51", "Ques2862997", false, 4, 2,
                []
            );
            expect(actResult.isOK).toBe(false);
            await QuesModel.deleteMany({ headText: "Ques2862997" });
        });
        test("Malformed question, no correct options", async () => {
            const actResult = await QuesModelOperation.addNewQues(
                "60661cf100cf94247c2c3b51", "Ques2862996", false, 4, 2,
                [{ label: "nc a", correct: false }, { label: "nc b", correct: false }]
            );
            expect(actResult.isOK).toBe(false);
            await QuesModel.deleteMany({ headText: "Ques2862996" });
        });
    }
    TestupdateQues() {
        test("Update existing question", async () => {
            await new QuesModel(quesData.ques1).save();
            const { quesID, headText, checkbox, points, attempts, options } = quesData.ques1update;
            const actResult = await QuesModelOperation.updateQues(quesID, headText, checkbox, points, attempts, options);
            const query = await QuesModel.findById(quesID);
            expect(actResult.isOK).toBe(true);
            expect(query.headText).toBe(headText);
            expect(query.checkbox).toBe(checkbox);
            expect(query.points).toBe(points);
            expect(query.attempts).toBe(attempts);
            await QuesModel.deleteMany({ _id: quesID });
        });
        test("Updating non-existent question", async () => {
            const { headText, checkbox, points, attempts, options } = quesData.ques1update;
            const quesID = '6098a2a34dc18915cc9f2cf0';
            const actResult = await QuesModelOperation.updateQues(quesID, headText, checkbox, points, attempts, options);
            expect(actResult.isOK).toBe(false);
        });
    }
    TestdeleteQues() {
        test("Delete single existing question", async () => {
            await new QuesModel(quesData.quesDel).save();
            const actResult = await QuesModelOperation.deleteQues(quesData.quesDel._id);
            const query = await QuesModel.find({ _id: quesData.quesDel._id });
            expect(actResult.isOK).toBe(true);
            expect(query.length).toBe(0);
        });
        test("Delete single non-existent question", async () => {
            const actResult = await QuesModelOperation.deleteQues("60655cf100cf94247c2c3b90");
            expect(actResult.isOK).toBe(false);
        });
    }
    TestfindOne() {
        test("Find one existing question", async () => {
            await new QuesModel(quesData.quesFind).save();
            const actResult = await QuesModelOperation.findOne(quesData.quesFind._id);
            expect(actResult.isOK).toBe(true);
            expect(actResult.load).toBeTruthy();
            await QuesModel.deleteMany({ _id: quesData.quesFind._id });
        });
        test("Find one non-existent question", async () => {
            const actResult = await QuesModelOperation.findOne("60655cf100cf94247c2c3b90");
            expect(actResult.isOK).toBe(false);
        });
    }
    TestfindMany() {
        test("Find multiple questions", async () => {
            const coll = quesData.quesCollectionFind;
            for(let i in coll) { await new QuesModel(coll[i]).save(); }
            const actResult = await QuesModelOperation.findMany(coll.map(v => String(v._id)));
            expect(actResult.isOK).toBe(true);
            expect(actResult.load.length).toBe(coll.length);
            await QuesModel.deleteMany({ belongsTo: "70661cf100cf94247c2c3b34" });
        });
    }
    TestdelMutiple() {
        test("Delete multiple questions", async () => {
            const coll = quesData.quesCollectionDel;
            for(let i in coll) { await new QuesModel(coll[i]).save(); }
            const actResult = await QuesModelOperation.delMutiple("40661cf100cf94247c2c3b92");
            const query = await QuesModel.find({ belongsTo: "40661cf100cf94247c2c3b92" });
            expect(actResult.isOK).toBe(true);
            expect(query.length).toBe(0);
        });
    }
}

const quesData = {
    ques1: {
        _id: "6098a2a34dc18915cc9f2cfb",
        belongsTo: "60661cf100cf94247c2c3b51",
        headText: "Ques2862994",
        checkbox: false,
        points: 4,
        attempts: 2,
        options: [
            { "label": "nc a", "correct": true  },
            { "label": "nc b", "correct": false }
        ]
    },
    ques1update: {
        quesID: "6098a2a34dc18915cc9f2cfb",
        headText: "Ques with valid title",
        checkbox: true,
        points: 3,
        attempts: 3,
        options: [
            { label: "nc a", correct: true  },
            { label: "nc b", correct: false },
            { label: "nc c", correct: true  }
        ]
    },
    quesFind: {
        _id: "6098a2a34dc18915cc9f2cd0",
        belongsTo: "60661cf100cf94247c2c3b51",
        headText: "Ques2862994",
        checkbox: false,
        points: 1,
        attempts: 1,
        options: [{ "label": "nc a", "correct": true  }, { "label": "nc b", "correct": false }]
    },
    quesDel: {
        _id: "6098a2a34dc18915cc9f2cd1",
        belongsTo: "60661cf100cf94247c2c3b51",
        headText: "Ques2862994",
        checkbox: false,
        points: 1,
        attempts: 1,
        options: [{ "label": "nc a", "correct": true  }, { "label": "nc b", "correct": false }]
    },
    quesCollectionFind: [
        {
            _id: "6098a2a34dc18915cc9f2ce0",
            belongsTo: "70661cf100cf94247c2c3b34",
            headText: "Ques2862994",
            checkbox: false,
            points: 1,
            attempts: 1,
            options: [{ "label": "nc a", "correct": true  }, { "label": "nc b", "correct": false }]
        },
        {
            _id: "6098a2a34dc18915cc9f2ce1",
            belongsTo: "70661cf100cf94247c2c3b34",
            headText: "Ques2862994",
            checkbox: false,
            points: 1,
            attempts: 1,
            options: [{ "label": "nc a", "correct": true  }, { "label": "nc b", "correct": false }]
        },
        {
            _id: "6098a2a34dc18915cc9f2ce2",
            belongsTo: "70661cf100cf94247c2c3b34",
            headText: "Ques2862994",
            checkbox: false,
            points: 1,
            attempts: 1,
            options: [{ "label": "nc a", "correct": true  }, { "label": "nc b", "correct": false }]
        }
    ],
    quesCollectionDel: [
        {
            _id: "6098a2a34dc18915cc9f2ce3",
            belongsTo: "40661cf100cf94247c2c3b92",
            headText: "Ques2862994",
            checkbox: false,
            points: 1,
            attempts: 1,
            options: [{ "label": "nc a", "correct": true  }, { "label": "nc b", "correct": false }]
        },
        {
            _id: "6098a2a34dc18915cc9f2ce4",
            belongsTo: "40661cf100cf94247c2c3b92",
            headText: "Ques2862994",
            checkbox: false,
            points: 1,
            attempts: 1,
            options: [{ "label": "nc a", "correct": true  }, { "label": "nc b", "correct": false }]
        },
        {
            _id: "6098a2a34dc18915cc9f2ce5",
            belongsTo: "40661cf100cf94247c2c3b92",
            headText: "Ques2862994",
            checkbox: false,
            points: 1,
            attempts: 1,
            options: [{ "label": "nc a", "correct": true  }, { "label": "nc b", "correct": false }]
        }
    ]
};

module.exports = QuesModelOperationTest;