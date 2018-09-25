import {Provider, isType, Type} from '../di';

/**
 * Injection Token for the Logging Adapter
 */
export const LoggingAdapter = 'LogginAdapter';

/**
 * Valid log levels
 */
export type LogLevel = 'debug'|'info'|'warn'|'error';

/**
 * Interface defintion for a LoggingAdapter
 */
export interface LoggingAdapter {
    log(level: LogLevel, name: string,msg: string, ...args: any[]): void;
}

/**
 * This function returns an injection provider for the given logging adapter
 * 
 * @param l - the logging adapter to use
 */
export function useLoggingAdapter(l: LoggingAdapter|Type<LoggingAdapter>): Provider {
    if (isType(l)) {
        return {
            provide: LoggingAdapter,
            useClass: l,
        };
    }
    
    return {
        provide: LoggingAdapter,
        useValue: l,
    };
}