import { Lexer, Token, LexerConfig } from "./lexer";

describe('Lexer', () => {
    describe('token types', () => {
        it('should correctly parse keywords', () => {
            const cfg = new LexerConfig();
            cfg.keywords = [ 'select', 'from'];

            const lexer = new Lexer('select * from "foobar"', cfg);

            expect(lexer.next()).toEqual({type: 'kw', value: 'select'});
            lexer.next() // skip *
            expect(lexer.next()).toEqual({type: 'kw', value: 'from'})
        });
        
        it('should correctly parse operators', () => {
            const lexer = new Lexer('== && foo || "bar" >');
            
            let expectOP = (val: string) => {
                expect(lexer.next()).toEqual({type: 'op', value: val})
            };
            
            expectOP('==');
            expectOP('&&');
            lexer.next() // skip foo
            expectOP('||');
            lexer.next() // skip "bar"
            expectOP('>');
        });
        
        it('should throw for invalid operators', () => {
            const lexer = new Lexer('&=');
            expect(() => lexer.next()).toThrow();
        })

        it('should correctly parse identifiers', () => {
            const lexer = new Lexer(`a * b > 10`);
            expect(lexer.next()).toEqual({type: 'ident', value: 'a'});
            lexer.next();
            expect(lexer.next()).toEqual({type: 'ident', value: 'b'});
            lexer.next();
            lexer.next();
        });
        
        it('should skip comments', () => {
            const lexer = new Lexer('# some comment \na > 10');
            let count = 0;
            while(lexer.next() != null) {
                count++;
            }
            
            expect(count).toBe(3);
        });

        it('should correctly parse escaped strings', () => {
            const lexer = new Lexer('"some \\"escaped\\" string"');
            expect(lexer.next()).toEqual({type: 'str', value: "some \"escaped\" string"});
        });
        
        it('should correctly parse numbers', () => {
            const lexer = new Lexer('10 20 30');

            expect(lexer.next()).toEqual({type: 'num', value: 10});
            expect(lexer.next()).toEqual({type: 'num', value: 20});
            expect(lexer.next()).toEqual({type: 'num', value: 30});
        });
        
        it('should correctly parse floats', () => {
            const lexer = new Lexer('10.1 20.2 30.3');

            expect(lexer.next()).toEqual({type: 'num', value: 10.1});
            expect(lexer.next()).toEqual({type: 'num', value: 20.2});
            expect(lexer.next()).toEqual({type: 'num', value: 30.3});
        });

        it('should throw for leading dots on numbers', () => {
            const lexer = new Lexer('10.1.0');
            expect(lexer.next()).toEqual({type: 'num', value: 10.1});
            expect(() => lexer.next()).toThrow()
        });
        
        it('should correctly read punctuation', () => {
            const lexer = new Lexer('( a + b ) > 10');

            expect(lexer.next()).toEqual({type: 'punc', value: '('});
            lexer.next()
            lexer.next()
            lexer.next()
            expect(lexer.next()).toEqual({type: 'punc', value: ')'});
        })
    });
    
    it('should correctly parse an expression', () => {
        const lexer = new Lexer('var1 + 10.5 > 0');

        const tokens: Token[] = [
            {type: 'ident', value: 'var1'},
            {type: 'op', value: '+'},
            {type: 'num', value: 10.5},
            {type: 'op', value: '>'},
            {type: 'num', value: 0}
        ];

        tokens.forEach(tok => {
            expect(lexer.next()).toEqual(tok);
        });

        expect(lexer.next()).toBe(null);
        expect(lexer.eof()).toBeTruthy();
    });
    
    it('should correctly parse identifiers', () => {
        const lexer = new Lexer('ProcessPath == "cmd.exe" && CommandLine like "foobar%"');
        const tokens: Token[] = [
            {type: 'ident', value: 'ProcessPath'},
            {type: 'op', value: '=='},
            {type: 'str', value: 'cmd.exe'},
            {type: 'op', value: '&&'},
            {type: 'ident', value: 'CommandLine'},
            {type: 'ident', value: 'like'},
            {type: 'str', value: 'foobar%'},
        ];
        
        tokens.forEach(tok => {
            expect(lexer.next()).toEqual(tok);
        });

        expect(lexer.next()).toBe(null);
        expect(lexer.eof()).toBeTruthy();
    });
});