import {Parser} from '../parser';
import {CommandTree} from '../internal';
import {Runnable} from '../interfaces';

class TestCommand implements Runnable {
    created = false;

    constructor() {
        this.created = true;
    }
    
    async run() {

    }
}

describe('Parser', () => {
    const tree: CommandTree = {
        options: {
            T1: {
                name: 'long-case',
                short: 'l',
                description: 'verbose-description',
            },
            T2: {
                name: 'short-case',
                short: '1',
                argType: 'boolean',
            },
            T3: {
                name: 'long-value',
                short: '2',
                argType: 'number',
                multiple: true,
            },
            T4: {
                name: 'bool',
                short: 'b',
                argType: null, // Default: boolean
                multiple: true,
            }
        },
        cls: TestCommand,
        name: 'test',
        parentFlags: {},
        parentProperties: {},
    };
    
    it('should parse flags correctly', () => {
        const result = Parser.parse([
            'test',
            '--long-case', 
            '-1',
            '--long-value=1',
            '--long-value', '2',
            '-2=3', 
            '-2', '1',
            '--bool=true',
            '--bool=false',
            '--bool=1',
            '--bool=0',
            '--bool=t',
            '--bool=f',
            '--bool', 'true',
            '--bool', '0',
            '-b=true',
            '-b=false',
            '-b=1',
            '-b=0',
            '-b=t',
            '-b=f',
        ], tree);
        
        expect(result.length).toBe(1);
        expect(result[0].args).toEqual([]);
        expect(result[0].tree).toBeDefined();
        expect(result[0].options.T1).toBe(true);
        expect(result[0].options.T2).toBe(true);
        expect(result[0].options.T3).toEqual([1, 2, 3, 1]);
        expect(result[0].options.T4).toEqual([true, false, true, false, true, false, true, false, true, false, true, false, true, false]);
    });
});