import {Provider} from '../di/provider';

export const LoggingAdapter = 'HomebotLoggingAdapter';

export interface LoggingAdapter {
    log(level: string, msg: string, ...args: any[]): void;
    
    debug(msg: string, ...args: any[]): void;
    
    info(msg: string, ...args: any[]): void;
    
    warn(msg: string, ...args: any[]): void;
    
    error(msg: string, ...args: any[]): void;
}

export function useLoggingAdapter(l: LoggingAdapter): Provider {
    return {
        provide: LoggingAdapter,
        useValue: l,
    };
}