export interface ErrorFields {
    [key: string]: any;
}

export class ExtendableError extends Error {
    private _fields: ErrorFields = {};

    constructor(name: string, message: string, fields?: ErrorFields) {
        super(message);
        
        Object.setPrototypeOf(this, new.target.prototype);
        
        if (!!fields) {
            this._fields = fields;
        }
        this.name = name;
    }
    
    addField(name: string, value: any): void {
        this._fields[name] = value;
    }
    
    toString(): string {
        let fieldString: string = Object.keys(this._fields).map(key => `${key}=${JSON.stringify(this._fields[key])}`).join(' ');

        return `${this.name}: ${this.message} ${fieldString}`;
    }
}

export function isExtenableError<T = any>(value: Error): value is ExtendableError {
    return value instanceof ExtendableError;
}