import {Type, ClassProvider, ValueProvider, Injectable} from '../di';

/**
 * A set of possible log levels
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

export const LOG_LEVEL = Symbol('LogLevel');

/**
 * Definition of a log message
 */
export interface LogMessage {
    /** The level of the log message */
    level: LogLevel;
    
    /** An optional name of the module that logs the message */
    module?: string;
    
    /** The actual message content */
    message: string;
    
    /** A set of additional fields to append to the log message */
    fields?: {
        [key: string]: any;
    };
};


export abstract class LoggingAdapter {
    abstract log(msg: LogMessage): void;
}

export function ProvideLoggingAdapter<T extends LoggingAdapter>(adapter: Type<T>): ClassProvider {
    return {
        provide: LoggingAdapter,
        useClass: adapter,
    };
}

export function ProvideLogLevel(level: LogLevel): ValueProvider {
    return {
        provide: LOG_LEVEL,
        useValue: level,
    };
}
    

@Injectable()
export class DefaultConsoleLoggingAdapter extends LoggingAdapter {
    log(msg: LogMessage): void {
        console.log(`${!!msg.module ? '['+msg.module+'] ' : ''}${msg.level}: ${msg.message}`);
    }
}
