import {ExpressionParser, ExpressionParserConfig, BinaryExpression} from './expression-parser';
import { IdentifierToken } from './lexer';

describe('ExpressionParser', () => {
    it('should parse a simple expression', () => {
        const result = ExpressionParser.parse_single('processName == "cmd.exe"');

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
        const result = ExpressionParser.parse_single('1 + 2 * 3'); // 1 + (2 * 3)
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
        expect(ExpressionParser.parse_single('true')).toEqual({type: 'bool', value: true});
        expect(ExpressionParser.parse_single('false')).toEqual({type: 'bool', value: false});
        
        const result = ExpressionParser.parse_single('true != false');
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

        const result = ExpressionParser.parse_single('Foo == null', cfg);
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
        
        expect(() => ExpressionParser.parse_single('foo > bar', cfg)).not.toThrow();
        expect(() => ExpressionParser.parse_single('foo > test', cfg)).toThrowError('Invalid identifier: "test"')
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

        expect(ExpressionParser.parse_single('SELECT ( foo, bar ) WHERE 1 != NULL', cfg)).toEqual({
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

        const result = ExpressionParser.parse_single('Foo LIKE "test%" && 1 > 2', cfg);
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
        const result = ExpressionParser.parse_single('Process.Parent.PID > 4 && ( 3 > 4 ) || ( Process.Name % "cmd.exe" )');
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

describe('Simple SQL-Parser', () => {
    let cfg: ExpressionParserConfig;

    beforeEach(() => {
        cfg = new ExpressionParserConfig();
        cfg.lexer.keywords.push('SELECT');
        cfg.lexer.keywords.push('AS')
        cfg.lexer.keywords.push('FROM');
        cfg.lexer.keywords.push('WHERE');
        cfg.lexer.keywords.push('JOIN');
        cfg.lexer.keywords.push('ON');
        
        function parseTable(this: ExpressionParser): {table: string, tableName?: string} {
            // The table name must either be an identifier or a string
            const table = this.parse_single();
            if (table.type !== 'ident' && table.type !== 'str') {
                this.input.croak(`Expected table name but got "${table.type}"`);
            }

            let tableNameAs: string | undefined = undefined;
            // there may be an AS expression
            if (this.is_kw('AS')) {
                this.skip_kw('AS');
                const name = this.parse_expression();
                
                if (name.type !== 'str' && name.type !== 'ident') {
                    this.input.croak('Expected a name for the table. Got ${name.type}');
                }
                
                tableNameAs = (name as any).value;
            }
            
            return {
                table: (table as any).value,
                tableName: tableNameAs
            }
        }
        
        cfg.keywordParsers['JOIN'] = function() {
            // Skip the JOIN keyword
            this.input.next();

            let {table, tableName} = parseTable.bind(this)();
            
            // there MUST be an ON keyword
            this.skip_kw('ON');
            const joinExpr = this.parse_expression();

            if (joinExpr.type !== 'binary') {
                this.input.croak('Expected a join expression')
            }

            return {
                type: 'join',
                table: table,
                tableName: tableName,
                expression: joinExpr,
            }
        }

        cfg.keywordParsers['SELECT'] = function() {
            // syntax: "SELECT <ident|*>, [<ident>], ... WHERE <expr>"
            
            // Skip the SELECT token
            this.input.next();
            
            let select: string[] | null | undefined = undefined;
            
            // check if the next token is a *
            if (this.is_punc('*')) {
                select = null;
            } else {
                select = [];
                while(!this.input.eof()) {
                    if (this.is_kw()) {
                        break;
                    }
                    
                    const tok = this.input.next()!;
                    if (tok.type !== 'ident' && tok.type !== 'str') {
                        this.input.croak(`Expected identifier or string but got ${tok.value}`);
                    }
                    
                    select.push(tok.value as string);
                    
                    // skip a ',' character if available
                    if (this.is_punc(',')) {
                        this.skip_punc(',');
                    }
                }
            }
            
            // there MUST be a FROM keyowrd
            this.skip_kw('FROM');
            
            let {table, tableName} = parseTable.bind(this)();
            
            let expression: BinaryExpression | undefined = undefined;
            
            // There may be a WHERE clause
            if (this.is_kw('WHERE')) {
                this.skip_kw('WHERE');
                let e = this.parse_expression();
                
                if (e.type !== 'binary') {
                    return this.input.croak(`Expected a binary expression after WHERE but got ${e.type}`);
                }
                
                expression = e as BinaryExpression;
            }

            let joins: any[] = [];
            // There might be multiple JOIN expressions
            while(this.is_kw('JOIN')) {
                let j = this.parse_atom();
                if (j.type !== 'join') {
                    this.input.croak(`Something went wrong ...`);
                }
                
                joins.push(j);
            }

            return {
                type: 'SELECT',
                properties: select,
                table: table,
                tableName: tableName,
                expression: expression,
                joins: joins
            }
        }
    });

    it('should parse simple a simple SQL statement', () => {
        const result = ExpressionParser.parse_single('SELECT foo, "bar" FROM test AS t WHERE t.foo > 10 JOIN another AS a ON a.id == t.id', cfg);

        const expected ={ 
            type: 'SELECT',
            properties: [ 'foo', 'bar' ],
            table: 'test',
            tableName: 't',
            expression: { 
                type: 'binary',
                operator: '>',
                left: { 
                    type: 'ident',
                    value: 't.foo'
                },
                right: { 
                    type: 'num',
                    value: 10
                }
            },
            joins: [
                { 
                    type: 'join',
                    table: 'another',
                    tableName: 'a',
                    expression: { 
                        type: 'binary',
                        operator: '==',
                        left: { 
                            type: 'ident',
                            value: 'a.id'
                        },
                        right: { 
                            type: 'ident',
                            value: 't.id'
                        }
                    }
                }
            ]
        };
        
        expect(result).toEqual(expected);
    })
})