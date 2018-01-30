import {Injectable, Optional, Inject} from '../di';
import {LoggingAdapter, DefaultConsoleLoggingAdapter, LOG_LEVEL, LogLevel} from './adapter';

export const LOG_PREFIX = 'LogPrefix';

@Injectable()
export class Logger {
    constructor(@Optional() private _adapter: LoggingAdapter,
                @Optional() @Inject(LOG_PREFIX) private _prefix: string,
                @Optional() @Inject(LOG_LEVEL) private _level: LogLevel) {
                
        if (this._adapter === undefined) {
            this._adapter = new DefaultConsoleLoggingAdapter();
        }
        
        if (this._level === undefined) {
            this._level = 'info';
        }
    }
    
    error(msg: string, fields?: {[key: string]: any}): void {
        if (!this._shouldLog('error')) {
            return;
        }
        this._adapter.log({
            level: 'error',
            message: msg,
            module: this._prefix,
            fields: fields,
        });
    }
    
    warn(msg: string, fields?: {[key: string]: any}): void {
        if (!this._shouldLog('warn')) {
            return;
        }
        this._adapter.log({
            level: 'warn',
            message: msg,
            module: this._prefix,
            fields: fields,
        });
    }
    
    info(msg: string, fields?: {[key: string]: any}): void {
        if (!this._shouldLog('info')) {
            return;
        }
        this._adapter.log({
            level: 'info',
            message: msg,
            fields: fields,
            module: this._prefix,
        });
    }
    
    verbose(msg: string, fields?: {[key: string]: any}): void {
        if (!this._shouldLog('verbose')) {
            return;
        }
        this._adapter.log({
            level: 'verbose',
            message: msg,
            fields: fields,
            module: this._prefix,
        });
    }
    
    debug(msg: string, fields?: {[key: string]: any}): void {
        if (!this._shouldLog('debug')) {
            return;
        }
        this._adapter.log({
            level: 'debug',
            message: msg,
            fields: fields,
            module: this._prefix,
        });
    }

    private _shouldLog(level: LogLevel): boolean {
        let order = ['error', 'warn', 'info', 'debug', 'verbose'];
        
        return order.indexOf(level) <= order.indexOf(this._level);
    }
}