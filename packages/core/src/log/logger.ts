import {Injectable, Inject, Optional} from '../di';
import {LoggingAdapter, LogLevel} from './adapter';
import {ConsoleAdapter} from './console.adapter';

enum Levels {
    debug,
    info,
    warn,
    error,
};

@Injectable()
export class Logger {
    private _fullName: string;
    private _parent: Logger|undefined;
    private _levels: LogLevel|undefined;
    
    constructor(
        @Inject(LoggingAdapter) @Optional() private _adapter?: LoggingAdapter,
        @Optional() private _name?: string,
    ) {
        if (!this._adapter) {
            this._adapter = new ConsoleAdapter();
        }
        
        this._fullName = this.getName();
    }
    
    setLogLevel(level: LogLevel) {
        this._levels = level;
    }
    
    /** Log a message given a log level */
    log(level: LogLevel, msg: string, ...args: any[]): void {
        if (!this.canLog(level)) {
            return;
        }
        
        this._adapter!.log(level, this._fullName, msg, ...args);
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
            let name = log.getOwnName();
            if (name !== undefined) {
                names.push(name);
            } 
            
            log = log._parent;
        }
        
        return names.reverse().join('.');
    }
    
    protected getOwnName(): string|undefined {
        return this._name;
    }
    
    protected setParent(parent: Logger): this {
        this._parent = parent;
        
        this._fullName = this.getName();
        
        return this;
    }
    
    canLog(level: LogLevel): boolean {
        if (this._levels === undefined && !!this._parent) {
            return this._parent.canLog(level); 
        }
        
        let l: LogLevel;
        if (this._parent === undefined && this._levels === undefined) {
            l = 'info';
        } else {
            l = this._levels!;
        }

        let idx = Levels[level];
        return idx >= Levels[l];
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
