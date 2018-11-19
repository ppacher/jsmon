import { Lexer, Token, LexerConfig } from './lexer';

export interface BinaryExpression {
    type: 'binary';
    parentheses: boolean;
    operator: string;
    left: AST;
    right: AST;
}

export interface BooleanValue {
    type: 'bool';
    value: boolean;
}

export interface Prog {
    type: 'prog';
    nodes: AST[];
}

export interface CustomToken {
    type: string;
}

export type AST = Token
                | Prog
                | BinaryExpression
                | CustomToken
                | BooleanValue;

export interface ParseFunction {
    (this: ExpressionParser): AST;
}


export enum PrecedenceLevel {
    Assign = 1,
    Or = 2,
    And = 3,
    Compare = 7,
    Addition = 10,
    Multiplication = 20
}

export class ExpressionParserConfig {
    lexer: LexerConfig = new LexerConfig();
    precedence: {[key: string]: number} = {
        "=": 1,
        "||": 2,
        "&&": 3,
        "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
        "+": 10, "-": 10,
        "*": 20, "/": 20, "%": 20,
    };
    keywordParsers: {
        [keyword: string]: ParseFunction
    } = {};
    
    validateIdentifier: (this: ExpressionParser) => void = () => {};
}

export class ExpressionParser {
    input: Lexer;
    in_parenthesis: boolean = false;
    
    private get parsers() {
        return this.config.keywordParsers;
    }
    
    /**
     * Returns a {@link ParseFunction} that is bound to the this {@link ExpressionParser} and
     * associated with a given keyword
     * 
     * @param keyword - The keyword that is associated with the parser function
     */
    parser(keyword: string): () => AST {
        const parser = this.parsers[keyword];
        if (!parser) {
            throw new Error(`Unknown ParseFunction "${keyword}"`);
        }
        
        return parser.bind(this);
    }

    constructor(input: string, private config: ExpressionParserConfig = new ExpressionParserConfig()) {
        // create the operator set based on the precedence set
        let operators = Object.keys(config.precedence);
        config.lexer.operators = operators;
        
        // Ensure all parse function have an associated keyword
        Object.keys(config.keywordParsers)
            .forEach(keyword => {
                if (!config.lexer.keywords.includes(keyword)) {
                    throw new Error(`ParseFunction for keyword "${keyword}" provided but no such keyword defined`);
                }
            });
            
        this.input = new Lexer(input, this.config.lexer);
    }
    
    /**
     * Parses the next AST node and returns it
     */
    parse_single(): AST {
        return this.parse_expression();
    }
    
    /**
     * Parses the whole input string and returns a {@link Prog} AST node
     */
    parse(): Prog {
        let nodes: AST[] = [];
        while (!this.input.eof()) {
            const node = this.parse_single();
            nodes.push(node);
            
            // A leading ; for each statement / AST node is optional
            try {
                this.skip_punc(';')
            } catch (err) {}
        }
        
        return {
            type: 'prog',
            nodes: nodes,
        };
    }
    
    /**
     * Parses the first AST node and returns it
     * 
     * @param input - The input string
     * @param [cfg] - An optional configuration for the parser
     */
    static parse_single(input: string, cfg?: ExpressionParserConfig): AST {
        return (new ExpressionParser(input, cfg)).parse_single();
    }
    
    /**
     * Parses the whole input string and returns a {@link Prog} AST node
     * 
     * @param input - The input string
     * @param [cfg] - An optional configuration for the parser
     */
    static parse(input: string, cfg?: ExpressionParserConfig): Prog {
        return (new ExpressionParser(input, cfg)).parse();
    }
    
    /**
     * Checks if the current token is a punctuation character
     * 
     * @param [ch] - The expected punctuation character (if any) 
     */
    is_punc(ch?: string): boolean {
        const tok = this.input.peek();
        return !!tok && tok.type === 'punc' && (!ch || tok.value === ch);
    }
    
    /**
     * Checks if the current token is a keyword
     * 
     * @param [kw] - The expected keyword value (if any)
     */
    is_kw(kw?: string): boolean {
        const tok = this.input.peek();
        return !!tok && tok.type === 'kw' && (!kw || tok.value === kw);
    }
    
    /**
     * Checks if the current token is an operator
     * 
     * @param [op] - The expected operator (if any)
     */
    is_op(op?: string): boolean {
        const tok = this.input.peek();
        return !!tok && tok.type === 'op' && (!op || tok.value === op);
    }
    
    /**
     * Skips the given punctuation character or throws an error
     *
     * @param ch - The expected punctuation character
     */
    skip_punc(ch: string) {
        if (this.is_punc(ch)) {
           this.input.next();
        } else {
            this.input.croak(`Expected punctuation: "${ch}"`);
        }
    }
    
    /**
     * Skips the given keyword or throws an error
     * 
     * @param kw - Th expected keyword
     */
    skip_kw(kw: string) {
        if (this.is_kw(kw)) {
            this.input.next();
        } else {
            this.input.croak(`Expected keyword: "${kw}"`);
        }
    }
    
    /**
     * Skips the given operator or throws an error
     * 
     * @param op - Th expected keyword
     */
    skip_op(op: string) {
        if (this.is_op(op)) {
            this.input.next();
        } else {
            this.input.croak(`Expected operator: "${op}"`);
        }
    }
    
    /**
     * Throws an "unexpected token" error
     */
    unexpected(): never {
        return this.input.croak(`Unexpected token`);
    }
    
    /**
     * Parses a list of tokens enclosed in a start an stop punctuation character
     * and separated by another punctuation character. 
     * 
     * @param start - The start punctuation character
     * @param stop - The end punctuation character
     * @param separator - The punctuation separator character (e.g. ",")
     * @param parser - The parser function to use for the tokens
     */
    delimited(start: string, stop: string, separator: string, parser: (this: ExpressionParser) => AST): AST[] {
        let a: AST[] = [];
        let first = true;

        this.skip_punc(start);
        while(!this.input.eof()) {
            if (this.is_punc(stop)) {
                break;
            };
            if (first) {
                first = false;
            } else {
                this.skip_punc(separator);
            }
            if (this.is_punc(stop)) {
                break;
            }
            a.push(parser.bind(this)());
        }
        this.skip_punc(stop);
        return a;
    }
    
    /**
     * Parses a boolean token
     */
    parse_bool(): AST {
        return {
            type: 'bool',
            value: this.input.next()!.value ===  'true'
        };
    }
    
    /**
     * Parses the next token and returns the matching AST node
     */
    parse_atom(): AST {
        if (this.is_punc('(')) {
            this.in_parenthesis = true;
            this.input.next();
            const exp = this.parse_expression();
            this.skip_punc(')');
            this.in_parenthesis = false;
            return exp;
        }

        // Special case for boolean values
        if (this.is_kw('true') || this.is_kw('false')) {
            return this.parse_bool();
        }

        if (this.is_kw() && this.parsers[this.input.peek()!.value] !== undefined) {
            return this.parser(this.input.peek()!.value as string)();
        }
        
        let tok = this.input.peek()!;
        if (tok.type === 'num' || tok.type === 'str' || tok.type === 'ident' || tok.type === 'kw') {
            if (tok.type === 'ident' && !!this.config.validateIdentifier) {
                this.config.validateIdentifier.bind(this)();
            }
            
            this.input.next();
            return tok;
        }
        
        return this.unexpected();
    }
    
    /**
     * Tries to parse a binary expression. If the current token is not an
     * operator, the left AST node is returned as it is
     * 
     * @param left - The left side of the binary expression
     * @param my_prec - The current predicate of the binary expression
     */
    maybe_binary(left: AST, my_prec: number): AST {
        const isOp = this.is_op();
        if (isOp) {
            const tok = this.input.peek()!;
            let his_prec = this.config.precedence[tok.value];
            if (his_prec > my_prec) {
                this.input.next();
                return this.maybe_binary({
                    type: 'binary',
                    parentheses: this.in_parenthesis,
                    operator: tok.value as string,
                    left: left,
                    right: this.maybe_binary(this.parse_atom(), his_prec)
                }, my_prec);
            }
        }
        return left;
    }
    
    /**
     * Parses the next expression
     */
    parse_expression(): AST {
        return this.maybe_binary(this.parse_atom(), 0);
    }
}