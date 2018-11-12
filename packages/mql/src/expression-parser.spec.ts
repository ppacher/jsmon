import {ExpressionParser, ExpressionParserConfig} from './expression-parser';
import { IdentifierToken } from './lexer';

describe('ExpressionParser', () => {
    it('should parse a simple expression', () => {
        const result = ExpressionParser.parse('processName == "cmd.exe"');

        expect(result).toEqual({
            type: 'binary',
            operator: '==' ,
            left: {
                type: 'ident',
                value: 'processName'
            },
            right: {
                type: 'str',
                value: 'cmd.exe'
            }
        });
    });
    
    it('should correctly handle operator precedence', () => {
        const result = ExpressionParser.parse('1 + 2 * 3'); // 1 + (2 * 3)
        expect(result).toEqual({
            type: 'binary',
            operator: '+',
            left: {
                type: 'num',
                value: 1
            },
            right: {
                type: 'binary',
                operator: '*',
                left: {
                    type: 'num',
                    value: 2
                },
                right: {
                    type: 'num',
                    value: 3
                }
            }
        })
    });
    
    it('should correctly parse booleans', () => {
        expect(ExpressionParser.parse('true')).toEqual({type: 'bool', value: true});
        expect(ExpressionParser.parse('false')).toEqual({type: 'bool', value: false});
        
        const result = ExpressionParser.parse('true != false');
        expect(result).toEqual({
            type: 'binary',
            operator: '!=',
            left: {
                type: 'bool',
                value: true
            },
            right: {
                type: 'bool',
                value: false
            }
        });
    });
    
    it('should support custom keywords', () => {
        const cfg = new ExpressionParserConfig()
        cfg.lexer.keywords.push('null');

        const result = ExpressionParser.parse('Foo == null', cfg);
        expect(result).toEqual({
            type: 'binary',
            operator: '==',
            left: {
                type: 'ident',
                value: 'Foo'
            },
            right: {
                type: 'kw',
                value: 'null'
            }
        });
    });
    
    it('should support identifier validation functions',() => {
        let cfg = new ExpressionParserConfig();
        cfg.validateIdentifier = function() {
            let tok: IdentifierToken = this.input.peek()! as IdentifierToken;
            if (!['foo', 'bar'].includes(tok.value)) {
                this.input.croak(`Invalid identifier: "${tok.value}"`);
            }
        }
        
        expect(() => ExpressionParser.parse('foo > bar', cfg)).not.toThrow();
        expect(() => ExpressionParser.parse('foo > test', cfg)).toThrowError('Invalid identifier: "test"')
    });
    
    it('should support custom parser functions', () => {
        let cfg = new ExpressionParserConfig();
        cfg.lexer.keywords.push('SELECT');
        cfg.lexer.keywords.push('WHERE');
        cfg.lexer.keywords.push('NULL');
        
        cfg.keywordParsers['NULL'] = function() {
            return {
                type: 'null',
                value: null
            }
        }

        cfg.keywordParsers['SELECT'] = function() {
            // The current token should be the keyword of the function
            expect(this.input.peek()!.value).toBe('SELECT');
            
            // let's parse an argument list but first skip the current token
            this.input.next();
            
            if (!this.is_punc('(')) {
                this.input.croak(`Expected punctuation: "("`);
            }

            const args = this.delimited("(", ")", ",", this.parse_expression)
            
            // Now parse a binary expression that must follow after the WHERE keyword
            this.skip_kw("WHERE");
            
            const binaryExpression = this.parse_expression();
            
            // now expect a WHERE keyword
            return {
                type: 'SELECT',
                args: args,
                expression: binaryExpression,
                value: null
            }
        };

        expect(ExpressionParser.parse('SELECT ( foo, bar ) WHERE 1 != NULL', cfg)).toEqual({
            type: 'SELECT',
            args: [
                {
                    type: 'ident',
                    value: 'foo'
                },
                {
                    type: 'ident',
                    value: 'bar'
                }
            ],
            expression: {
                type: 'binary',
                operator: '!=',
                left: { type: 'num', value: 1},
                right: { type: 'null', value: null}
            },
            value: null
        });
    });
    
    it('should correctly support custom operators', () => {
        let cfg = new ExpressionParserConfig();
        cfg.precedence['LIKE'] = 7;

        const result = ExpressionParser.parse('Foo LIKE "test%" && 1 > 2', cfg);
        expect(result).toEqual({
            type: 'binary',
            operator: '&&',
            left: {
                type: 'binary',
                operator: 'LIKE',
                left: {
                    type: 'ident',
                    value: 'Foo'
                },
                right: {
                    type: 'str',
                    value: 'test%'
                }
            },
            right: {
                type: 'binary',
                operator: '>',
                left: {
                    type: 'num',
                    value: 1
                },
                right: {
                    type: 'num',
                    value: 2
                } 
            }
        })
    });
    
    it('should correctly parse complex expressions', () => {
        const result = ExpressionParser.parse('Process.Parent.PID > 4 && ( 3 > 4 ) || ( Process.Name % "cmd.exe" )');
        expect(result).toEqual({
            type: 'binary',
            operator: '||',
            left: {
                type: 'binary',
                operator: '&&',
                left: {
                    type: 'binary',
                    operator: '>',
                    left: {
                        type: 'ident',
                        value: 'Process.Parent.PID'
                    },
                    right: {
                        type: 'num',
                        value: 4
                    }
                },
                right: {
                    type: 'binary',
                    operator: '>',
                    left: {
                        type: 'num',
                        value: 3
                    },
                    right: {
                        type: 'num',
                        value: 4
                    }
                }
            },
            right: {
                type: 'binary',
                operator: '%',
                left: {
                    type: 'ident',
                    value: 'Process.Name'
                },
                right: {
                    type: 'str',
                    value: 'cmd.exe'
                }
            }
        });
    });
});