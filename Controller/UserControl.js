const { UserModelOperation } = require('../Model/UserModel');
const { Result, scanParams, sessExist, sessClear, renderERR } = require('../utils/general');
const ExamControl = require('./ExamControl');
const ScriptControl = require('./ScriptControl');
const path = require('path');

class UserControl {

    static async signUpReqGET(req, res) {
        res.render(path.join(__dirname, '../View/pages/signup.ejs'), { error: false, errorMsg: null });
    }

    static async signUpReqPOST(req, res) {

        if(!scanParams(req.body, ['fname', 'lname', 'uname', 'email', 'password', 'role', 'stid', 'dept'])) {
            res.render(path.join(__dirname, '../View/pages/signup.ejs'), { error: true, errorMsg: 'Required fields are empty' });
            return;
        }

        let firstName  = req.body.fname;
        let lastName   = req.body.lname;
        let userName   = req.body.uname;
        let email      = req.body.email;
        let pass       = req.body.password;
        let isStudent  = req.body.role === 'student';
        let studentID  = req.body.stid;
        let department = req.body.dept;

        const signup = Result.convDB(await UserModelOperation.addNewUser(firstName, lastName, userName, email, pass, isStudent, studentID, department));

        if(!signup.ok) {
            res.render(path.join(__dirname, '../View/pages/signup.ejs'), { error: true, errorMsg: signup.msg });
            return;
        }

        res.redirect('/login');
    }

    static async loginReqGET(req, res) {
        res.render(path.join(__dirname, '../View/pages/login.ejs'), { error: false, errorMsg: null });
    }

    static async loginReqPOST(req, res) {

        if(!scanParams(req.body, ['username', 'password'])) {
            res.render(path.join(__dirname, '../View/pages/login.ejs'), { error: true, errorMsg: 'Email or password is empty' });
            return;
        }

        let userName = req.body.username;
        let pass     = req.body.password;

        const login = Result.convDB(await UserModelOperation.authQuery(userName, pass));

        if(!login.ok) {
            res.render(path.join(__dirname, '../View/pages/login.ejs'), { error: true, errorMsg: login.msg });
            return;
        }

        let key  = login.load.key;
        let role = login.load.isStudent;

        req.session.user = { key, role };

        res.redirect('/board');
    }

    static async dashboardReqGET(req, res) {

        if(sessExist(req)) {
            let user = req.session.user;
            let profile = Result.convDB(await UserModelOperation.fetchUser(user.key));
            if(!profile.ok) {
                renderERR(res, profile.msg);
                return;
            }
            if(user.role) {
                res.render(
                    path.join(__dirname, '../View/pages/studentdashboard.ejs'),
                    { user: profile.load, history: await ScriptControl.getScriptHistory(user.key) }
                );
            } else {
                res.render(
                    path.join(__dirname, '../View/pages/teacherdashboard.ejs'),
                    { user: profile.load, history: await ExamControl.getExamHistory(user.key) }
                );
            }
        } else {
            res.redirect('/login');
        }
    }

    static async logoutReqGET(req, res) {

        sessClear(req);
        res.redirect('/login');
    }

    static async indexReqGET(req, res) {
        res.redirect('/board');
    }
}

module.exports = UserControl;