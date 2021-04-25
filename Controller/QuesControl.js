const { QuesModelOperation } = require('../Model/QuesModel');
const { ExamModelOperation } = require('../Model/ExamModel');
const { Result, scanParams, sessExist } = require('../utils/general');

class QuesControl {
    static async updtQuesReqPOST(req, res) {

        if(!scanParams(req.body, ['quesid', 'examid', 'head', 'checkbox', 'points', 'attempts', 'options'])) {
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

        let quesID   = req.body.quesid;
        let headText = req.body.head;
        let checkbox = req.body.checkbox;
        let points   = req.body.points;
        let attempts = req.body.attempts;
        let options  = req.body.options;

        const update = Result.convDB(await QuesModelOperation.updateQues(quesID, headText, checkbox, points, attempts, options));
        if(!update.ok) {
            res.send({ ok: false, msg: update.msg });
        } else {
            res.send({ ok: true, msg: 'OK' });
        }
    }
}

module.exports = QuesControl;