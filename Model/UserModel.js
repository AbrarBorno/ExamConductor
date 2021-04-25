const mongoose  = require('mongoose');
const bcrypt = require('bcryptjs');
const { ResultDB } = require('../utils/general');

const { Student, Teacher } = require('../Controller/classes');

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName:  String,
    userName:  String,
    email:     String,
    pass:      String,
    isStudent: Boolean,

    studentID:  String,
    department: String
});

const UserModel = mongoose.model('User', userSchema);

class UserModelOperation {
    static async addNewUser(firstName, lastName, userName, email, pass, isStudent, studentID, department) {
        try {
            const testQuery = await UserModel.find({ userName: userName }).exec();
            if(testQuery.length > 0) {
                return new ResultDB(true, false, "Username already exists", null);
            }
            const user = new UserModel({
                firstName,
                lastName,
                userName,
                email,
                pass: bcrypt.hashSync(pass, 8),
                isStudent,
                studentID: isStudent ? studentID : null,
                department: isStudent ? null : department
            });
            await user.save();
            return new ResultDB(true, true, "OK", null);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async authQuery(userName, pass) {
        try {
            const testQuery = await UserModel.find({ userName: userName }).exec();
            if(testQuery.length === 0) {
                return new ResultDB(true, false, "No user found for this username", null);
            }
            const user = testQuery[0];
            // user.pass === pass
            if(bcrypt.compareSync(pass, user.pass)) {
                return new ResultDB(true, true, "OK", {
                    key: user._id,
                    user: UserModelOperation._mapFromModel(user),
                    isStudent: user.isStudent
                });
            } else {
                return new ResultDB(true, false, "Password incorrect", null);
            }
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async fetchUser(userID) {
        try {
            const testQuery = await UserModel.findById(userID).exec();
            if(testQuery === null) {
                return new ResultDB(true, false, "Failed to fetch user", null);
            } else {
                return new ResultDB(true, true, "OK", UserModelOperation._mapFromModel(testQuery));
            }
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static async deleteUser(userID) {
        try {
            const delQuery = await UserModel.findByIdAndDelete(userID, { useFindAndModify: false }).exec();
            return new ResultDB(true, delQuery !== null, null, null);
        } catch(e) {
            return new ResultDB(false, false, e.toString(), null);
        }
    }

    static _mapFromModel(model) {
        if(model.isStudent) {
            const user = new Student(
                model.firstName,
                model.lastName,
                model.userName,
                model.email,
                model.pass,
                model.studentID
            );
            user._id = model._id;
            return user;
        } else {
            const user = new Teacher(
                model.firstName,
                model.lastName,
                model.userName,
                model.email,
                model.pass,
                model.department
            );
            user._id = model._id;
            return user;
        }
    }
}

module.exports = { UserModel, UserModelOperation };