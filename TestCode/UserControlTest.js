const { Request, Response, SEND, RENDER, REDIRECT } = require('./helpers/utils');
const UserControl = require('../Controller/UserControl');
const { UserModel } = require('../Model/UserModel');
const Test = require('./helpers/Test');

class UserControlTest extends Test {
    TestsignUpReqGET() {
        test("Get signup page", async () => {
            const res = new Response();
            await UserControl.signUpReqGET(null, res);
            expect(res.method).toBe(RENDER);
            expect(res.getRendered().path).toMatch(/.*signup\.ejs/g);
            expect(res.getRendered().data.error).toBe(false);
        });
    }
    TestsignUpReqPOST() {
        test("Perfect Signup attempt", async () => {
            const req = new Request();
            const res = new Response();
            req.setBody({
                fname: 'FirstName',
                lname: 'LastName',
                uname: 'UserName0x001',
                email: 'newuser@exco.edu',
                password: '1234abcd',
                role: 'student',
                stid: '19283746',
                dept: null
            });
            await UserControl.signUpReqPOST(req, res);
            expect(res.getRedirected()).toBe('/login');
            await UserModel.deleteMany({ userName: 'UserName0x001' });
        });
        test("Signup insufficient form data", async () => {
            const req = new Request();
            const res = new Response();
            req.setBody({ fname: 'FirstName', lname: 'LastName' });
            await UserControl.signUpReqPOST(req, res);
            expect(res.getRendered().path).toMatch(/.*signup\.ejs/g);
            expect(res.getRendered().data.error).toBe(true);
            expect(res.getRendered().data.errorMsg).toBe('Required fields are empty');
        });
        test("Signup username already exists", async () => {
            await new UserModel({ userName: 'UserName0x002' }).save();
            const req = new Request();
            const res = new Response();
            req.setBody({
                fname: 'FirstName',
                lname: 'LastName',
                uname: 'UserName0x002',
                email: 'newuser@exco.edu',
                password: '1234abcd',
                role: 'student',
                stid: '19283746',
                dept: null
            });
            await UserControl.signUpReqPOST(req, res);
            expect(res.getRendered().path).toMatch(/.*signup\.ejs/g);
            expect(res.getRendered().data.error).toBe(true);
            expect(res.getRendered().data.errorMsg).toBe('Username already exists');
            await UserModel.deleteMany({ userName: 'UserName0x002' });
        });
    }
    TestloginReqGET() {
        test("Get login page", async () => {
            const res = new Response();
            await UserControl.loginReqGET(null, res);
            expect(res.method).toBe(RENDER);
            expect(res.getRendered().path).toMatch(/.*login\.ejs/g);
            expect(res.getRendered().data.error).toBe(false);
        });
    }
    TestloginReqPOST() {
        test("Login with correct credentials", async () => {
            await new UserModel({ isStudent: true, userName: 'UserName0x003', pass: '$2a$08$iGEhvJClE9jZIXHmiCsJu.ePpa/5fA3DFPHzlS5/Ip/6Edc0aIXEy' }).save();
            const req = new Request();
            const res = new Response();
            req.setBody({ username: 'UserName0x003', password: 'abcd1234' });
            await UserControl.loginReqPOST(req, res);
            expect(res.getRedirected()).toBe('/board');
            expect(req.session.user.key).toBeTruthy();
            await UserModel.deleteMany({ userName: 'UserName0x003' });
        });
        test("Login with incorrect credentials", async () => {
            await new UserModel({ isStudent: true, userName: 'UserName0x004', pass: '$2a$08$iGEhvJClE9jZIXHmiCsJu.ePpa/5fA3DFPHzlS5/Ip/6Edc0aIXEy' }).save();
            const req = new Request();
            const res = new Response();
            req.setBody({ username: 'UserName0x004', password: 'abcd4321' });
            await UserControl.loginReqPOST(req, res);
            expect(res.method).toBe(RENDER);
            expect(res.getRendered().path).toMatch(/.*login\.ejs/g);
            expect(res.getRendered().data.error).toBe(true);
            expect(req.session.user.key).toBeFalsy();
            await UserModel.deleteMany({ userName: 'UserName0x004' });
        });
        test("Login with incomplete form data", async () => {
            const req = new Request();
            const res = new Response();
            req.setBody({ username: 'UserName0x005' });
            await UserControl.loginReqPOST(req, res);
            expect(res.method).toBe(RENDER);
            expect(res.getRendered().path).toMatch(/.*login\.ejs/g);
            expect(res.getRendered().data.error).toBe(true);
            expect(req.session.user.key).toBeFalsy();
        });
    }
    TestdashboardReqGET() {
        test("Get teacher dashboard", async () => {
            const doc = new UserModel({ isStudent: false, userName: 'UserName0x006', pass: 'hr4i89yt4p39r8843' });
            await doc.save();
            const req = new Request({ key: doc._id, role: false });
            const res = new Response();
            await UserControl.dashboardReqGET(req, res);
            expect(res.method).toBe(RENDER);
            expect(res.getRendered().path).toMatch(/.*teacherdashboard\.ejs/g);
            await UserModel.deleteMany({ userName: 'UserName0x006' });
        });
        test("Get student dashboard", async () => {
            const doc = new UserModel({ isStudent: true, userName: 'UserName0x007', pass: 'hr4i89yt4p39r8843' });
            await doc.save();
            const req = new Request({ key: doc._id, role: true });
            const res = new Response();
            await UserControl.dashboardReqGET(req, res);
            expect(res.method).toBe(RENDER);
            expect(res.getRendered().path).toMatch(/.*studentdashboard\.ejs/g);
            await UserModel.deleteMany({ userName: 'UserName0x007' });
        });
        test("Unauthorized dashboard access", async () => {
            const req = new Request();
            const res = new Response();
            await UserControl.dashboardReqGET(req, res);
            expect(res.method).toBe(REDIRECT);
            expect(res.getRedirected()).toBe('/login');
        });
    }
    TestlogoutReqGET() {
        test("Logout User", async () => {
            const req = new Request({ key: 'any', role: true });
            const res = new Response();
            await UserControl.logoutReqGET(req, res);
            expect(res.method).toBe(REDIRECT);
            expect(res.getRedirected()).toBe('/login');
            expect(req.session.user.key).toBeFalsy();
        });
    }
    TestindexReqGET() {
        test("Redirect to dashboard", async () => {
            const res = new Response();
            await UserControl.indexReqGET(null, res);
            expect(res.getRedirected()).toBe('/board');
        });
    }
}

module.exports = UserControlTest;