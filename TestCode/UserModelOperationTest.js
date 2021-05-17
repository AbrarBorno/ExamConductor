const { UserModel, UserModelOperation } = require('../Model/UserModel');
const Test = require('./helpers/Test');
const bcrypt = require('bcryptjs');

class UserModelOperationTest extends Test {
    TestaddNewUser() {
        test("Add user as teacher", async () => {
            const { firstName, lastName, userName, email, pass, isStudent, studentID, department } = userDataSet.teacher1;
            const resActual = await UserModelOperation.addNewUser(firstName, lastName, userName, email, pass, isStudent, studentID, department);
            const query = await UserModel.find({ userName });
            expect(resActual.isOK).toBe(true);
            expect(query.length > 0).toBe(true);
            await UserModel.deleteMany({ userName });
        });
        test("Add user as student", async () => {
            const { firstName, lastName, userName, email, pass, isStudent, studentID, department } = userDataSet.student1;
            const resActual = await UserModelOperation.addNewUser(firstName, lastName, userName, email, pass, isStudent, studentID, department);
            const query = await UserModel.find({ userName });
            expect(resActual.isOK).toBe(true);
            expect(query.length > 0).toBe(true);
            await UserModel.deleteMany({ userName });
        });
        test("Add teacher while username already exists", async () => {
            const { firstName, lastName, userName, email, pass, isStudent, studentID, department } = userDataSet.teacherOverride;
            await new UserModel({ firstName, lastName, userName, email, pass, isStudent, studentID, department }).save();
            const resActual = await UserModelOperation.addNewUser(firstName, lastName, userName, email, pass, isStudent, studentID, department);
            expect(resActual.isOK).toBe(false);
            await UserModel.deleteMany({ userName });
        });
        test("Add student while username already exists", async () => {
            const { firstName, lastName, userName, email, pass, isStudent, studentID, department } = userDataSet.studentOverride;
            await new UserModel({ firstName, lastName, userName, email, pass, isStudent, studentID, department }).save();
            const resActual = await UserModelOperation.addNewUser(firstName, lastName, userName, email, pass, isStudent, studentID, department);
            expect(resActual.isOK).toBe(false);
            await UserModel.deleteMany({ userName });
        });
    }
    TestauthQuery() {
        test("Username ok, password ok", async () => {
            await new UserModel({ userName: 'usercorr1', pass: bcrypt.hashSync('passcorr', 8), isStudent: false}).save();
            const resActual = await UserModelOperation.authQuery('usercorr1', 'passcorr');
            expect(resActual.isOK).toBe(true);
            await UserModel.deleteMany({ userName: 'usercorr1' });
        });
        test("Username ok, password wrong", async () => {
            await new UserModel({ userName: 'usercorr2', pass: bcrypt.hashSync('passcorr', 8), isStudent: false}).save();
            const resActual = await UserModelOperation.authQuery('usercorr2', 'passwrng');
            expect(resActual.isOK).toBe(false);
            await UserModel.deleteMany({ userName: 'usercorr2' });
        });
        test("Username wrong", async () => {
            await new UserModel({ userName: 'usercorr3', pass: bcrypt.hashSync('passcorr', 8), isStudent: false}).save();
            const resActual = await UserModelOperation.authQuery('userwrng', 'passcorr');
            expect(resActual.isOK).toBe(false);
            await UserModel.deleteMany({ userName: 'usercorr3' });
        });
    }
    TestfetchUser() {
        test("Fetch user that exists", async () => {
            await new UserModel({ _id: '60986cfc69bf22a8ec40ea6d', userName: 'usermock_x', isStudent: false}).save();
            const resActual = await UserModelOperation.fetchUser('60986cfc69bf22a8ec40ea6d');
            expect(resActual.isOK).toBe(true);
            await UserModel.deleteMany({ userName: 'usermock_x' });
        });
        test("Fetch user that does not exist", async () => {
            const resActual = await UserModelOperation.fetchUser('60986cfc69bf22a8ec40ea6b');
            expect(resActual.isOK).toBe(false);
        });
    }
    TestdeleteUser() {
        test("Delete existing user", async () => {
            await new UserModel({ _id: '60986cfc69bf22a8ec40ea6a', userName: 'usermock_y', isStudent: false}).save();
            const resActual = await UserModelOperation.deleteUser('60986cfc69bf22a8ec40ea6a');
            const query = await UserModel.find({ _id: '60986cfc69bf22a8ec40ea6a' });
            expect(resActual.isOK).toBe(true);
            expect(query.length).toBe(0);
        });
        test("Delete non-existent user", async () => {
            const resActual = await UserModelOperation.deleteUser('60986cfc69bf22a8ec40ea6c');
            expect(resActual.isOK).toBe(false);
        });
    }
}

const userDataSet = {
    teacher1: {
        firstName:  'Teacher',
        lastName:   'One',
        userName:   'teach1',
        email:      'teach1@exco.edu',
        pass:       '1234',
        isStudent:  false,
        studentID:  null,
        department: 'CSE'
    },
    teacherOverride: {
        firstName:  'Teacher',
        lastName:   'Over',
        userName:   'tover',
        email:      'tover@exco.edu',
        pass:       '4321',
        isStudent:  false,
        studentID:  null,
        department: 'CSE'
    },
    student1: {
        firstName:  'Student',
        lastName:   'One',
        userName:   'student1',
        email:      'student1@exco.edu',
        pass:       '5678',
        isStudent:  true,
        studentID:  '11223344',
        department: null
    },
    studentOverride: {
        firstName:  'Student',
        lastName:   'Over',
        userName:   'sover',
        email:      'sover@exco.edu',
        pass:       '8765',
        isStudent:  true,
        studentID:  '11223344',
        department: null
    }
};

module.exports = UserModelOperationTest;