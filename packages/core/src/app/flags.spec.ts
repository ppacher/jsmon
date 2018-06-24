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
    });
    
    it('should throw for missing values', () => {
        expect(() => createFlagSet([{name: 'foo', required: true}], [])).toThrow();
    });
    
    it('should throw for missing parameters', () => {
        expect(() => createFlagSet([{name: 'foo'}], ['--foo'])).toThrow();
        expect(() => createFlagSet([{name: 'foo'}], ['--foo='])).toThrow();
    });

    it('should throw for invalid short args', () => {
        expect(() => createFlagSet([{name: 'foo', short: 'f'}], ['-f'])).toThrow();
        expect(() => createFlagSet([{name: 'foo', short: 'f'}], ['-foo='])).toThrow();
        expect(() => createFlagSet([{name: 'foo', short: 'f'}], ['-fo'])).not.toThrow();
        expect(() => createFlagSet([{name: 'foo', short: 'f'}], ['-f=o'])).not.toThrow();
    });

    it('should support boolean parameters', () => {
        let flagSet = [
            {name: 'debug', boolean: true},
            {name: 'insecure', boolean: true},
            {name: 'host'}
        ];
        let params = ['--debug', '--host', 'example.com', '--insecure=false'];

        let flags = createFlagSet(flagSet, params);

        expect(flags.getFlag('debug').string()).toBe('true');
        expect(flags.getFlag('insecure').string()).toBe('false');
        expect(flags.getFlag('host').string()).toBe('example.com');
        
        expect(() => createFlagSet(flagSet, ['--debug=foobar'])).toThrow();
    });
});