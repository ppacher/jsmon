/** Input stream returns one character at a time */
export class InputStream {
    private _pos: number = 0;
    private _col: number = 0;
    private _line: number = 0;
    
    constructor(private _input: string) {}
    
    /** Returns the next character and removes it from the stream */
    next(): string | null {
        const ch = this._input.charAt(this._pos++);
        if (ch == '\n') {
            this._line++;
            this._col = 0;
        } else {
            this._col++;
        }
        
        return ch;
    }
    
    /** Revert moves the current stream position back by `num` characters */ 
    revert(num: number) {
        for(let i = num; i > 0; i--) {
            this._pos--;
            this._col--;
            if (this._col < 0) {
                this._line--;
                let p = 0;
                // TODO(ppacher): the column is now incorrect! fix it
                console.log(`Line and columns are now incorrect`);
            }
        }
    }
    
    /** Returns the next character in the stream but does not remove it */
    peek(): string {
        return this._input.charAt(this._pos);
    }
    
    /** Returns true if we reached the end of the stream */
    eof(): boolean {
        return this.peek() == '';
    }
    
    /** Throws an error with the current line and column */
    croak(msg: string): never {
        throw new Error(`${msg} (${this._line}:${this._col})`);
    }
}

export interface PuncToken {
    type: 'punc';
    value: string;
}

export interface NumToken {
    type: 'num';
    value: number;
}

export interface StringToken {
    type: 'str';
    value: string;
}

export interface KeywordToken {
    type: 'kw';
    value: string;
}

export interface IdentifierToken {
    type: 'ident';
    value: string;
}

export interface OperatorToken {
    type: 'op';
    value: string;
}

export type Token = PuncToken
                    | NumToken
                    | StringToken
                    | KeywordToken
                    | IdentifierToken
                    | OperatorToken;

export class LexerConfig {
    /** A list of supported keywords */
    keywords: string[] = [
        'true',
        'false'
    ];
    
    /** A regular expression to match digits */
    digitRegex: RegExp = /[0-9]/i;
    
    /** A regular expression that matches identifier starts */
    identifierStart: RegExp = /[a-zA-Z]/i;
    
    /** All possible characters of an identifier */
    identifierChars: string = "?!-<>=0123456789.";
    
    /** A list of supported operators */
    operators: string[] = ['+', '-', '*', '/', '%', '==', '&', '&&', '|', '||', '>', '>=', '<', '<=', '!', '!='];
    
    /** Supported and allowed punctuation characters */
    punctuation: string[] = [',', ';', '(', ')', '[', ']', '{', '}'];
    
    /** What to treat as whitespace */
    whitespace: string[] = [' ', '\t', '\n'];
}

export class Lexer {
    private _current: Token | null = null;
    private _input: InputStream;

    constructor(input: string,
                private _config: LexerConfig = new LexerConfig()) {
                
        // We always support the boolean values
        if (!this._config.keywords.includes('true')) {
            this._config.keywords.push('true');
        }
        if (!this._config.keywords.includes('false')) {
            this._config.keywords.push('false');
        }
        
        this._input = new InputStream(input);
    }

    public peek(): Token | null {
        return this._current || (this._current = this._read_next());
    }

    public next(): Token | null {
        let tok = this._current;
        this._current = null;
        return tok || this._read_next();
    }
    
    public eof(): boolean {
        return this.peek() === null;
    }
    
    public croak (msg: string): never {
        return this._input.croak(`${msg}. Current token is "${!!this.peek() ? this.peek()!.value : null}"`);
    }
    
    private _read_while(predicate: (ch: string) => boolean): string {
        let str = '';
        while (!this._input.eof() && predicate(this._input.peek())) {
            str += this._input.next();
        }
        
        return str;
    }
    
    private _read_number(): NumToken {
        let has_dot = false;
        let number = this._read_while((ch: string) => {
            if (ch === '.') {
                if (has_dot) {
                    return false;
                }
                
                has_dot = true;
                return true;
            }
            return this._is_digit(ch);
        });
        return {
            type: 'num',
            value: has_dot ? parseFloat(number) : parseInt(number)
        }
    }
    
    private _read_ident(): any {
        let id = this._read_while(ch => this._is_id(ch));
        return {
            type: this._is_keyword(id) ? 'kw' : 'ident',
            value: id
        };
    }
    
    private _read_escaped(end: string): string {
        let escaped = false;
        let str = '';
        
        // Skip the start character
        this._input.next();

        while (!this._input.eof()) {
            let ch = this._input.next();
            if (escaped) {
                str += ch;
                escaped = false;
            } else if(ch === '\\') {
                escaped = true;
            } else if(ch === end) {
                break;
            } else {
                str += ch;
            }
        }
        return str;
    }
    
    private _read_operator(): OperatorToken {
        const op = this._read_while(ch => this._is_op_char(ch));
        
        if (this._config.operators.includes(op)) {
            return {
                type: 'op',
                value: op
            }
        }
        
        // this is not a valid operator value
        // so we need to revert the input stream
        this._input.revert(op.length);
        
        // now throw an error so that _read_next() will continue
        return this._input.croak(`Invalid operators "${op}" at `)
    }
    
    private _read_string(): StringToken {
        return {
            type: 'str',
            value: this._read_escaped('"')
        }
    }
    
    private _skip_comment() {
        this._read_while(ch => ch !== '\n');
        this._input.next();
    }
    
    private _read_next(): Token | null {
        this._read_while(ch => this._is_whitespace(ch));
        if (this._input.eof()) {
            return null;
        }
        
        let ch = this._input.peek();
        if (ch === '#') {
            this._skip_comment();
            return this._read_next();
        }
        
        if (ch === '"') return this._read_string();
        if (this._is_digit(ch)) return this._read_number();
        
        try {
            if (this._is_op_char(ch)) return this._read_operator();
        } catch (err) {/** TODO(ppacher): should we remember that error? */}
        
        if (this._is_ident_start(ch)) return this._read_ident();
        if (this._is_punc(ch)) {
            return {
                type: 'punc',
                value: this._input.next()!,
            };
        }
        
        // Failed to handle the input character
        return this._input.croak(`Can't handle character: ${ch}`);
    }

                            
    private _is_keyword(x: string) {
        return this._config.keywords.includes(x);
    }

    private _is_digit(x: string) {
        return this._config.digitRegex.test(x);
    }

    private _is_ident_start(ch: string) {
        return this._config.identifierStart.test(ch);
    }

    private _is_id(ch: string) {
        return this._is_ident_start(ch) || this._config.identifierChars.includes(ch);
    }

    private _is_op_char(ch: string) {
        const opChars = this._config.operators.join('');
        return opChars.includes(ch);
    }

    private _is_punc(ch: string) {
        return this._config.punctuation.includes(ch);
    }

    private _is_whitespace(ch: string) {
        return this._config.whitespace.includes(ch);
    }

}