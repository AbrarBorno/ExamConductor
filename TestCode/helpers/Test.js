class Test {
    runAll() {
        const testMethods = getAllFuncs(this).filter(name => name.startsWith('Test'));
        const thisName = this.constructor.name;

        describe(thisName.replace('Test', ''), () => {
            for (let i = 0; i < testMethods.length; i++) {
                const tmethod = this[testMethods[i]];
                const tname = testMethods[i].replace('Test', '') + '()';
                describe(tname, tmethod);
            }
        });
    }
}

function getAllFuncs(toCheck) {
    let props = [];
    let obj = toCheck;
    do {
        props = props.concat(Object.getOwnPropertyNames(obj));
    } while (obj = Object.getPrototypeOf(obj));

    return props.sort().filter(function(e, i, arr) { 
       if (e!=arr[i+1] && typeof toCheck[e] == 'function') return true;
    });
}

module.exports = Test;