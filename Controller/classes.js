class User {
    constructor(firstName, lastName, userName, email, password, role) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.userName = userName;
        this.email = email;
        this.password = password;
        this.role = role;
        this._id = null;
    }
}

class Student extends User {
    constructor(firstName, lastName, userName, email, password, studentID) {
        super(firstName, lastName, userName, email, password, "STUDENT");
        this.studentID = studentID;
    }
}

class Teacher extends User {
    constructor(firstName, lastName, userName, email, password, department) {
        super(firstName, lastName, userName, email, password, "TEACHER");
        this.department = department;
    }
}

class Question {
    constructor(points, questionText, options, checkbox, attempts) {
        this.points = points;
        this.questionText = questionText;
        this.options = options;
        this.checkbox = checkbox;
        this.attempts = attempts;
        this._id = null;
    }
}

class QuestionMCQ extends Question {
    constructor(points, questionText, options, attempts, correctIndex) {
        super(points, questionText, options, false, attempts);
        this.correctIndex = correctIndex;
    }
}

class QuestionCheckbox extends Question {
    constructor(points, questionText, options, attempts, correctIndexes) {
        super(points, questionText, options, true, attempts);
        this.correctIndexes = correctIndexes;
    }
}

class Answer {
    constructor(question, attemptRem, checkbox) {
        this.question = question;
        this.attemptRem = attemptRem;
        this.checkbox = checkbox;
    }
}

class AnswerMCQ extends Answer {
    constructor(question, attemptRem, selectedIndex) {
        super(question, attemptRem, false);
        this.selectedIndex = selectedIndex;
    }
}

class AnswerCheckbox extends Answer {
    constructor(question, attemptRem, selectedIndexes) {
        super(question, attemptRem, true);
        this.selectedIndexes = selectedIndexes;
    }
}

class Exam {
    constructor(name, windowStart, windowEnd, duration, setBased, quesPerSet, quesPool, author) {
        this.name = name;
        this.windowStart = windowStart;
        this.windowEnd = windowEnd;
        this.duration = duration;
        this.setBased = setBased;
        this.quesPerSet = quesPerSet;
        this.quesPool = quesPool;
        this.author = author;
        this._id = null;
    }
}

class AnswerScript {
    constructor(belongsTo, startTime, submitPressed, sortedQues, examRef) {
        this.belongsTo = belongsTo;
        this.startTime = startTime;
        this.submitPressed = submitPressed;
        this.sortedQues = sortedQues;
        this.examRef = examRef;
        this._id = null;
    }
}

class Result {
    constructor(totalPoints, score) {
        this.totalPoints = totalPoints;
        this.score = score;
    }
}

module.exports = { Exam, QuestionMCQ, QuestionCheckbox, Student, Teacher, AnswerScript, AnswerMCQ, AnswerCheckbox };