const path = require('path');

class Result {
    constructor(ok, msg, code, load) {
        this.ok   = ok;
        this.load = load;
        this.code = code;
        this.msg  = msg;
    }

    static convDB(db) {
        const ok   = db.queryOK && db.isOK;
        const msg  = db.queryOK ? db.msg : "Internal server Error";
        const code = db.queryOK ? (db.isOK ? 200 : 400) : 500;
        const load = db.load;
        if(!db.queryOK) {
            console.log(`[DB ERROR] ${db.msg}`);
        }
        return new Result(ok, msg, code, load);
    }

    static okResult(load) {
        return new Result(true, "OK", 200, load);
    }
}

const scanParams = (object, params) => {
    for (let i = 0; i < params.length; i++) {
        if(object[params[i]] === undefined) {
            return false;
        }
    }
    return true;
};

const sessExist = (req) => {
    if(!req.session.user) return false;
    if(!('key' in req.session.user)) return false;
    if(!('role' in req.session.user)) return false;
    return true;
};

const mapOtions = (opt, corr) => {
    const mapped = opt.map(label => { return { label, correct: false }; });
    corr.forEach(idx => { if(mapped[idx]) mapped[idx].correct = true; });
    return mapped;
};

const mapAttemptOptions = (opt, corr, chkd) => {
    const mapped = opt.map(label => { return { label, correct: false, checked: false }; });
    corr.forEach(idx => { if(mapped[idx]) mapped[idx].correct = true; });
    chkd.forEach(idx => { if(mapped[idx]) mapped[idx].checked = true; });
    return mapped;
};

const sessClear = (req) => {
    req.session.destroy();
};

const mergedById = (ar1, ar2, key1, key2) => {
    const map = new Map();
    const merged = [];
    ar1.forEach(val => map.set(val[key1], val));
    ar2.forEach(val => {
        if(map.has(val[key2])) {
            merged.push({
                ...map.get(val[key2]),
                ...val
            });
        }
    });
    return merged;
};

class ResultDB {
    constructor(queryOK, isOK, msg, load) {
        this.queryOK = queryOK;
        this.isOK    = isOK;
        this.msg     = msg;
        this.load    = load;
    }
}

// class Dhaka {
//     static now() {
//         return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"})).getTime();
//     }
// }

const renderMSG = (res, code, data) => res.render(path.join(__dirname, '../View/pages/exammsg.ejs'), {code, data});
const renderERR = (res, data) => renderMSG(res, 7, data);

module.exports = { Result, ResultDB, scanParams, sessExist, sessClear, mapOtions, mapAttemptOptions, renderMSG, renderERR, mergedById };