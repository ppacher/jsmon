/**
 * This file generate rough type definitions for the tinkerforge package.
 * 
 * It is known that they are NOT correct in terms of parameter and return value definitions!
 */
var tinkerforge = require('tinkerforge');

var con = new tinkerforge.IPConnection();

var classes = [];

function writeClassDefinitions(cls) {
    classes.push(cls.name);

    console.log(`\texport class ${cls.name} {`)
    
    Object.keys(cls).forEach(key => {
        // skip constants for function definitions
        if (key.startsWith('FUNCTION')) {
            return;
        }
        
        console.log(`\t\tstatic readonly ${key}: ${typeof cls[key]};`);
    });
    
    console.log('');

    if (cls.name !== 'IPConnection') {
        console.log(`\t\tconstructor(uid: string|number, ip: IPConnection);`)
    } else {
        console.log(`\t\tconstructor();`)
    }
    console.log('');

    let o = new cls('', con);

    Object.keys(o).forEach(key => {
        if (typeof o[key] !== 'function') {
            return;
        }
        
        let fndec = o[key].toString().split('\n')[0]
        let params = fndec.split('(')[1].split(')')[0].split(',');
        
        let dec = `${key}(`;
        
        let p = params.filter(p => p != '').map(p => {
            if (p.trim() === 'returnCallback') {
                return 'result?: (...args: any[]) => void';
            }
            
            if (p.trim() === 'errorCallback') {
                return 'error?: (error: number) => void';
            }
            
            return `${p.trim()}: any`
        })
        
        dec += p.join(', ');
        
        dec += '): void;';

        console.log(`\t\t${dec}`);
    })
    
    console.log(`\t}`);
}

console.log('declare module \'tinkerforge\' {');

for(var cls in tinkerforge) {
    writeClassDefinitions(tinkerforge[cls]);
    console.log('');

}
    
console.log(`\texport type All = ${classes.join(' | ')}`);

console.log('}')
