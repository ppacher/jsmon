import {Injectable} from '@angular/core';

export class Logger {
    constructor(private _name: string) {}

    log(level: string, msg: string, ...args: any[]) {
        console.log(`｢${this._name}｣ ∷${level}∷ ${msg}`, ...args);
    }

    info(msg: string, ...args: any[]) {
        this.log('info', msg, ...args);
    }
}

@Injectable({providedIn: 'root'})
export class LogFactory {
    constructor() {}

    createLogger(name: string): Logger {
        return new Logger(name);
    }
}

