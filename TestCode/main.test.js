const ExamControlTest          = require('./ExamControlTest');
const ExamModelOperationTest   = require('./ExamModelOperationTest');
const QuesControlTest          = require('./QuesControlTest');
const QuesModelOperationTest   = require('./QuesModelOperationTest');
const ScriptControlTest        = require('./ScriptControlTest');
const ScriptModelOperationTest = require('./ScriptModelOperationTest');
const UserControlTest          = require('./UserControlTest');
const UserModelOperationTest   = require('./UserModelOperationTest');

const { connect, closeDatabase, clearDatabase } = require('./helpers/dbConnectMock');

const testObjects = [
    new ExamControlTest(),
    new ExamModelOperationTest(),
    new QuesControlTest(),
    new QuesModelOperationTest(),
    new ScriptControlTest(),
    new ScriptModelOperationTest(),
    new UserControlTest(),
    new UserModelOperationTest()
];

describe("Unit Tests", () => {
    beforeAll(async () => {
        await connect();
    });
    afterAll(async () => {
        await clearDatabase();
        await closeDatabase();
    });

    testObjects.forEach(obj => obj.runAll());
});

/*
Private methods are not considered while unit testing.
below listed are the private methods with their respective classes.
I did not write test cases for these.

UserModelOperation
	- _mapFromModel()
QuesModelOperation
	- _mapFromModel()
ExamModelOperation
	- _makeFromModel()


ExamControl
	- mapToRender()
ScriptControl
	- determineState()
	- processAnswerScript()
	- mapQuesAns()
	- evalQuesAns()
	- evalSingle()
	- mapToRender()
	- calcObtained()
	- calcScoreZip()
*/
