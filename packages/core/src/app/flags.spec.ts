import {createFlagSet} from './flags';

describe('FlagSet', () => {
    it('should parse long options', () => {
        let flags = createFlagSet([{ name: 'foo' }, {name: 'another'}], ['--foo', 'bar', '--another=success']);
        
        expect(flags.getFlag('foo').string()).toBe('bar');
        expect(flags.getFlag('another').string()).toBe('success');
    });

    it('should parse short flags', () => {
        let flags = createFlagSet([
            {name: 'foo', short: 'f'},
            {name: 'bar', short: 'b'},
        ], ['-f=foo', '-b', 'bar']);
        
        expect(flags.getFlag('foo').string()).toBe('foo');
        expect(flags.getFlag('bar').string()).toBe('bar');
    })
});