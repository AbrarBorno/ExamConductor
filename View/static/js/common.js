class FrontQues {
    constructor(headText, options, checkbox, quesID, attempts, points) {
        this.headText = headText;
        this.options  = options;
        this.checkbox = checkbox;
        this.quesID   = quesID;
        this.attempts = attempts;
        this.points   = points;
    }
    static fromElement(holder) {
        return new FrontQues(
            FrontQues.parseText(holder),
            FrontQues.parseOptionsFull(holder),
            FrontQues.isCheckbox(holder),
            FrontQues.parseQuesID(holder),
            FrontQues.parseAttemptCount(holder),
            FrontQues.parsePoints(holder)
        );
    }
    static parseChoice(holder) {
        const selected = FrontQues.parseCorrects(holder);
        const attempt = FrontQues.parseAttemptCount(holder);
        const quesid = FrontQues.parseQuesID(holder);
        return { selected, attempt, quesid };
    }
    static setAttempts(holder, count) {
        $(holder).find('.attext > span')[0].innerText = count;
    }
    static parseText(holder) {
        const head = $(holder).find('.hdtext');
        return head[0].innerHTML.trim();
    }
    static parseOptionsFull(holder) {
        const options = $(holder).find('.optq');
        const ret = new Array(options.length);
        for (let i = 0; i < options.length; i++) {
            const option = $(options[i]).children();
            ret[i] = {
                checked: option[0].checked === true,
                label:   option[1].innerText.trim()
            };
        }
        return ret;
    }
    static parseAttemptCount(holder) {
        const atval = $(holder).find('.attext > span')[0].innerText;
        return atval !== 'Infinity' ? parseInt(atval) : Infinity;
    }
    static parsePoints(holder) {
        const atval = $(holder).find('.pntext > span')[0].innerText;
        return parseInt(atval);
    }
    static isCheckbox(holder) {
        return $(holder).attr('data-qtype') === 'cbox';
    }
    static parseQuesID(holder) {
        return $(holder).attr('data-qsid');
    }
    static parseCorrects(holder) {
        const options = $(holder).find('.optq > .optin');
        const ret = [];
        for (let i = 0; i < options.length; i++) {
            if(options[i].checked === true) {
                ret.push(i);
            }
        }
        return ret;
    }
    convertToElement(development) {
        const DIV = document.createElement('div');
        DIV.className = 'bg-light pt-5 pb-4 px-5 rounded my-4';
        DIV.setAttribute('data-qtype', this.checkbox ? 'cbox' : 'mcq');
        DIV.setAttribute('data-qsid',  this.quesID);
        ///////

        const PGRAPH = document.createElement('p');
        PGRAPH.className = 'lead hdtext';
        PGRAPH.innerHTML = this.headText;
        DIV.appendChild(PGRAPH);

        const ATTEXT = document.createElement('p');
        ATTEXT.className = 'attext text-muted';
        const ATTNDE = document.createTextNode('Attempts remaining: ');
        ATTEXT.appendChild(ATTNDE);
        const ATTVAL = document.createElement('span');
        ATTVAL.innerHTML = this.attempts;
        ATTEXT.appendChild(ATTVAL);
        DIV.appendChild(ATTEXT);

        const PNTEXT = document.createElement('p');
        PNTEXT.className = 'pntext text-muted';
        const PNTNDE = document.createTextNode('Points: ');
        PNTEXT.appendChild(PNTNDE);
        const PNTVAL = document.createElement('span');
        PNTVAL.innerHTML = this.points;
        PNTEXT.appendChild(PNTVAL);
        DIV.appendChild(PNTEXT);


        for (let i = 0; i < this.options.length; i++) {
            const option = this.options[i];

            const INDIV = document.createElement('div');
            INDIV.className = 'form-check optq mx-2 my-2';

            const INPUT = document.createElement('input');
            INPUT.className = 'form-check-input optin';
            INPUT.type      = this.checkbox ? 'checkbox' : 'radio';
            INPUT.name      = 'q_' + this.quesID;
            INPUT.checked   = option.checked;
            INPUT.disabled  = development;
            INDIV.appendChild(INPUT);

            const LABEL = document.createElement('label');
            LABEL.className = 'form-check-label optlb';
            LABEL.innerHTML = option.label;
            INDIV.appendChild(LABEL);

            DIV.appendChild(INDIV);
        }

        if(development) {
            const EDBTN = document.createElement('button');
            EDBTN.type = 'button';
            EDBTN.className = 'bsub btn btn-success mt-3 mrgnrt mb-3 d-inline';
            EDBTN.innerText = 'Edit';
            EDBTN.setAttribute('onclick', 'editFly(this)');
            DIV.appendChild(EDBTN);

            const DLBTN = document.createElement('button');
            DLBTN.type = 'button';
            DLBTN.className = 'bedt btn btn-danger mt-3 mrgnrt mb-3 d-inline';
            DLBTN.innerText = 'Delete';
            DLBTN.setAttribute('onclick', 'deltFly(this)');
            DIV.appendChild(DLBTN);
        } else {
            const BUTTON = document.createElement('button');
            BUTTON.type = 'button';
            BUTTON.className = 'bdel btn btn-primary btn-danger mt-3 mb-3';
            BUTTON.innerText = 'Submit';
            BUTTON.setAttribute('onclick', 'submitAction(this)');
            DIV.appendChild(BUTTON);
        }

        return DIV;
    }
}

const addNewQues = (cbox) => {
    const panel = $("#editPanel");
    if(panel.hasClass("hider")) {
        panel.removeClass("hider");
        EditQues.newQues(cbox);
    }
};

class EditQues {
    static captureQues(holder) {
        const ques = FrontQues.fromElement(holder);
        $("#editQuesText").html(ques.headText);
        $("#att_input").val(ques.attempts === Infinity ? 0 : ques.attempts);
        $("#pnt_input").val(ques.points);

        const panel = $("#editPanel");
        panel.attr("data-firsttime", "false");
        panel.attr("data-qsid", ques.quesID);
        panel.attr("data-cbox", ques.checkbox);

        const optio = $("#optio");
        const nmKey = 'x_' + ques.quesID;
        optio.empty();
        ques.options.forEach(option => optio.append(EditQues.editableOption(option, ques.checkbox, nmKey)));
    }
    static newQues(cbox) {
        $("#editQuesText").html("");
        $("#att_input").val(1);
        $("#pnt_input").val(1);

        const panel = $("#editPanel");
        panel.attr("data-firsttime", "true");
        panel.attr("data-qsid", "null");
        panel.attr("data-cbox", cbox);

        const optio = $("#optio");
        optio.empty();
    }
    static addBlankOpt() {
        const panel = $("#editPanel");
        const qsid = panel.attr("data-qsid");
        const cbox = panel.attr("data-cbox") === 'true';
        const optio = $("#optio");
        const nmKey = 'x_' + qsid;
        optio.append(EditQues.editableOption({ label: '', checked: false }, cbox, nmKey));
    }
    static editToQues() {
        let headText = $("#editQuesText").val().trim();
        if(headText.length === 0) { alert("Question text cannot be empty"); return null; }

        let attempts = $("#att_input").val();
        { let temp = parseInt(attempts); if(isNaN(temp) || temp < 0) { alert("Invalid attempts count"); return null; } else attempts = temp; }

        let points = $("#pnt_input").val();
        { let temp = parseInt(points); if(isNaN(temp) || temp < 1) { alert("Invalid points count"); return null; } else points = temp; }

        let optio = document.querySelector('#optio').children;
        let count = 0;
        let retOp = new Array(optio.length);
        for (let i = 0; i < optio.length; i++) {
            let children = $(optio[i]).children();
            let checked  = children[0].checked === true;
            let label    = children[1].value.trim();
            if(label.length === 0) { alert("Option can't be empty"); return null; }
            retOp[i] = { checked, label };
            count += checked ? 1 : 0;
        }
        if(count === 0) { alert("There must be at least one option and at least one correct option"); return null; }

        const panel = $("#editPanel");
        const qsid = panel.attr("data-qsid");
        const cbox = panel.attr("data-cbox") === 'true';
        
        return new FrontQues(
            headText,
            retOp,
            cbox,
            qsid === 'null' ? null : qsid,
            attempts === 0 ? Infinity : attempts,
            points
        );
    }
    static editableOption(option, checkbox, nameKey) {
        const DIV = document.createElement('div');
        DIV.className = "form-check optn mx-2 my-2";

        const SEL = document.createElement('input');
        SEL.className = "form-check-input optin";
        SEL.type = checkbox ? "checkbox" : "radio";
        SEL.name = nameKey;
        if(checkbox) {
            SEL.checked = option.checked;
        } else {
            if(option.checked) {
                SEL.checked = true;
            }
        }

        const INP = document.createElement('input');
        INP.className = "optxt";
        INP.type = "text";
        INP.placeholder = "option here...";
        INP.value = option.label;

        const CRS = document.createElement('button');
        CRS.className = "ntype delop";
        CRS.setAttribute("onclick", "removeSelf(this)");
        CRS.innerHTML = "❌";

        DIV.appendChild(SEL);
        DIV.appendChild(INP);
        DIV.appendChild(CRS);
        return DIV;
    }
}

const submitAction = (button) => {
    const holder = button.parentElement;
    const frontq = FrontQues.fromElement(holder);
    console.log(frontq);
};

const rport = (element) => {
    console.log(element.parentElement);
};

const removeSelf = (cross) => {
    $(cross.parentElement).remove();
}

const editFly = (button) => {
    const panel = $("#editPanel");
    if(panel.hasClass("hider")) {
        panel.removeClass("hider");
        EditQues.captureQues(button.parentElement);
    }
};

const deltFly = (button) => {
    const holder  = button.parentElement;
    const QUES_ID = FrontQues.parseQuesID(holder);
    fetch('delq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            quesid: QUES_ID,
            examid: EXAM_ID
        })
    })
    .then(res => {
        return res.json();
    })
    .then(json => {
        if(json.ok === true) {
            location.reload();
        } else {
            console.log(json);
            alert(json.msg);
        }
    })
    .catch(error => {
        console.log(error);
        alert('Error while deleting question');
    });
};

const closeFly = () => {
    const panel = $("#editPanel");
    if(!panel.hasClass("hider")) {
        panel.addClass("hider");
    }
};

const mapFX = (val) => { return { label: val.label, correct: val.checked }; }

const saveFly = () => {
    const ques = EditQues.editToQues();
    if(ques === null) return;
    const firstTime = $("#editPanel").attr("data-firsttime") === "true";
    if(firstTime) {
        const data = {
            examid: EXAM_ID,
            head: ques.headText,
            checkbox: ques.checkbox,
            points: ques.points,
            attempts: ques.attempts === Infinity ? -1 : ques.attempts,
            options: ques.options.map(mapFX)
        };
        fetch('insertq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => {
            return res.json();
        })
        .then(json => {
            if(json.ok === true) {
                location.reload();
            } else {
                console.log(json);
                alert(json.msg);
            }
        })
        .catch(error => {
            console.log(error);
            alert('Error while saving question');
        });
    } else {
        const data = {
            quesid: ques.quesID,
            examid: EXAM_ID,
            head: ques.headText,
            checkbox: ques.checkbox,
            points: ques.points,
            attempts: ques.attempts === Infinity ? -1 : ques.attempts,
            options: ques.options.map(mapFX)
        };
        fetch('editq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => {
            return res.json();
        })
        .then(json => {
            if(json.ok === true) {
                location.reload();
            } else {
                console.log(json);
                alert(json.msg);
            }
        })
        .catch(error => {
            console.log(error);
            alert('Error while saving question');
        });
    }
};

const addBlankOpt = () => {
    EditQues.addBlankOpt();
};

const trySubmit = (button) => {
    const { selected, attempt, quesid } = FrontQues.parseChoice(button.parentElement);
    const examid = EXAM_ID;
    if(attempt === 0) {
        return;
    }
    if(selected.length === 0) {
        alert("Select at least one option");
        return;
    }
    fetch('attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quesid, examid, selected })
    })
    .then(res => {
        return res.json();
    })
    .then(json => {
        if(json.ok === true) {
            FrontQues.setAttempts(button.parentElement, attempt - 1);
        } else {
            console.log(json);
            alert(json.msg);
        }
    })
    .catch(error => {
        console.log(error);
        alert('Error while submitting');
    });
};

const updateSetting = () => {
    const name = $("#namebox").val().trim();
    const time = parseInt($("#timebox").val());
    const setb = $("#setbox").prop('checked');
    const qnum = parseInt($("#countbox").val());

    const start = new Date(document.getElementById('startbox').innerText).getTime();
    const end   = new Date(document.getElementById('endbox').innerText).getTime();

    if(name === '') { alert("Name cannot be empty"); return; }
    if(start >= end) { alert('Invalid Time range'); return; }
    if(time < 5 || Number.isNaN(time)) { alert("Time cannot be less than 5 mins"); return; }
    if(Number.isNaN(qnum) || qnum < 0) { alert("Question count cannot be empty");  return; }
    if(setb && qnum > $("#contlist").children().length) { alert("Question count per set cannot be greater than total questions"); return; }

    fetch('updatexm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: EXAM_ID,
            name: name,
            duration: time,
            start: start,
            end: end,
            randomset: setb,
            perset: qnum
        })
    })
    .then(res => {
        return res.json();
    })
    .then(json => {
        if(json.ok === true) {
            location.reload();
        } else {
            console.log(json);
            alert(json.msg);
        }
    })
    .catch(error => {
        console.log(error);
        alert('Error while updating settings');
    });
};

const startTimer = (rem) => {
    window.timeLeft = (parseInt(rem) + 1) * 60;
    window.timeHandle = setInterval(() => {
        if(window.timeLeft <= 0) {
            clearInterval(window.timeHandle);
            endExam();
        } else {
            document.getElementById('timer').innerHTML = tickDown(window.timeLeft--);
        }
    }, 1000);
};

const tickDown = (time) => {
    const hh = String(time / 3600 | 0);
    time %= 3600;
    const mm = String(time / 60 | 0);
    time %= 60;
    const ss = String(time | 0);
    return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:${ss.padStart(2, '0')}`;
};

const endExam = () => {
    fetch('endxm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examid: EXAM_ID })
    })
    .then(res => {
        return res.json();
    })
    .then(json => {
        if(json.ok === true) {
            location.reload();
        } else {
            console.log(json);
        }
    })
    .catch(error => {
        console.log(error);
    });
};

const dropExam = () => {
    fetch('dropxm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: EXAM_ID })
    })
    .then(res => {
        return res.json();
    })
    .then(json => {
        if(json.ok === true) {
            location.href = '/board';
        } else {
            console.log(json);
        }
    })
    .catch(error => {
        console.log(error);
    });
};

const makeExam = () => {
    const name     = document.getElementById('namebox').value.trim();
    const duration = parseInt(document.getElementById('timebox').value);
    const start    = new Date(document.getElementById('startbox').innerText).getTime();
    const end      = new Date(document.getElementById('endbox').innerText).getTime();

    if(name.length === 0) { alert('Name cannot be empty'); return; }
    if(start >= end) { alert('Invalid Time range'); return; }

    fetch('examnew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, duration, start, end })
    })
    .then(res => {
        return res.json();
    })
    .then(json => {
        if(json.ok === true) {
            location.href = `/editxm?id=${json.examID}`;
        } else {
            console.log(json);
        }
    })
    .catch(error => {
        console.log(error);
    });
};

// window.scroll(0, window.scrollY + 200)

// const scrollURL = (window) => {
//     const url = new URL(window.location.href);
//     url.searchParams.set('scroll', window.scrollY);
//     return url.href;
// };

// const scrollAnchor = (window) => {
//     const url = new URL(window.location.href);
//     if(url.searchParams.has('scroll')) {
//         window.scroll(0, parseFloat(url.searchParams.get('scroll')));
//     }
// };

let myPicker, pickButton;

if(SimplePicker) {
    myPicker = new SimplePicker();

    pickButton = (element) => {
        myPicker.open();
        myPicker.reset(new Date(element.innerText));
        myPicker.iden = element.id;
    };

    myPicker.on('submit', (date, rdate) => {
        document.getElementById(myPicker.iden).innerText = date.toLocaleString();
    });
}