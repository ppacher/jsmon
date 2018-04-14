import {Injectable, Inject, Optional} from '@homebot/core';
import {LoggingAdapter, LogLevel} from './adapter';
import {ConsoleAdapter} from './console.adapter';

@Injectable()
export class Logger {
    private _fullName: string;
    private _parent: Logger|undefined;
    
    constructor(
        @Inject(LoggingAdapter) @Optional() private _adapter: LoggingAdapter,
        @Optional() private _name: string = '(root)',
    ) {
        if (!this._adapter) {
            this._adapter = new ConsoleAdapter();
        }
        
        this._fullName = this.getName();
    }
    
    /** Log a message given a log level */
    log(level: LogLevel, msg: string, ...args: any[]): void {
        this._adapter.log(level, this._fullName, msg, ...args);
    }
    
    /** Print an info message */
    info(msg: string, ...args: any[]): void {
        this.log('info', msg, ...args);
    }
    
    /** Print a warning message */
    warn(msg: string, ...args: any[]): void {
        this.log('warn', msg, ...args);
    }
    
    /** Print an error message */
    error(msg: string, ...args: any[]): void {
        this.log('error', msg, ...args);
    }
    
    /** Print a debug log message */
    debug(msg: string, ...args: any[]): void {
        this.log('debug', msg, ...args);
    }
    
    /** Returns the name of the logger */
    getName(): string {
        let names: string[] = [];
        let log: Logger|undefined = this;

        while(!!log && log instanceof Logger) {
            names.push(log.getOwnName());
            
            log = log._parent;
        }
        
        return names.reverse().join('.');
    }
    
    protected getOwnName(): string {
        return this._name;
    }
    
    protected setParent(parent: Logger): this {
        this._parent = parent;
        
        return this;
    }
    
    /**
     * Returns a new child logger
     * 
     * @param name The name of the new logger
     */
    createChild(name: string): Logger {
        return new Logger(this._adapter, name)
            .setParent(this);
    }
}
