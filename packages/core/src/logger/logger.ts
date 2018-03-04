import {Injectable, Inject, Optional} from '../di';
import {LoggingAdapter} from './adapter';

@Injectable()
export class Logger {
    constructor(
        @Inject(LoggingAdapter) @Optional() private _adapter: LoggingAdapter,
    ) {}
    
    log(level: string, msg: string, ...args: any[]): void {
        if (this._adapter) {
            this._adapter.log(level, msg, ...args);
        } else {
            console.log(`[${level}] ${msg} ${args.length > 0 ? JSON.stringify(args) : ''}`);
        }
    }
    
    info(msg: string, ...args: any[]): void {
        this.log('info', msg, ...args);
    }
    
    warn(msg: string, ...args: any[]): void {
        this.log('warn', msg, ...args);
    }
    
    error(msg: string, ...args: any[]): void {
        this.log('error', msg, ...args);
    }
    
    debug(msg: string, ...args: any[]): void {
        this.log('debug', msg, ...args);
    }
}