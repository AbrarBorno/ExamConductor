const express   = require('express');
const session   = require('express-session');
const dbConnect = require('./utils/dbConnect');
const app       = express();

const UserControl   = require('./Controller/UserControl');
const ExamControl   = require('./Controller/ExamControl');
const QuesControl   = require('./Controller/QuesControl');
const ScriptControl = require('./Controller/ScriptControl');

const DBLINK = 'mongodb://localhost:27017/examine'; // Modify Database URL here
const PORT = process.env.PORT || 5000;

app.use(session({
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 365 },
    secret: 'fb477473ne46473h',
    resave: false,
    saveUninitialized: true
}));


app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.set('view engine', 'ejs');

app.use('/static', express.static('View/static'));

app.get('/',        UserControl.indexReqGET);
app.get('/exam',    ScriptControl.scriptReqGET);
app.get('/login',   UserControl.loginReqGET);
app.get('/board',   UserControl.dashboardReqGET);
app.get('/signup',  UserControl.signUpReqGET);
app.get('/logout',  UserControl.logoutReqGET);
app.get('/editxm',  ExamControl.editExamReqGET);
app.get('/report',  ScriptControl.dloadBulkReqGET);
app.get('/startxm', ScriptControl.scriptStartReqGET);
app.get('/xmcheck', ScriptControl.scriptTeachReqGET);


app.post('/delq',     ExamControl.delQuesReqPOST);
app.post('/editq',    QuesControl.updtQuesReqPOST);
app.post('/login',    UserControl.loginReqPOST);
app.post('/endxm',    ScriptControl.endExamReqPOST);
app.post('/dropxm',   ExamControl.dropExamReqPOST);
app.post('/signup',   UserControl.signUpReqPOST);
app.post('/examnew',  ExamControl.newExamReqPOST);
app.post('/insertq',  ExamControl.addQuesReqPOST);
app.post('/attempt',  ScriptControl.attemptReqPOST);
app.post('/updatexm', ExamControl.updateExamReqPOST);


dbConnect(DBLINK).then(() => {
    app.listen(PORT);
    console.log(`Listening to port [${PORT}]`);
});