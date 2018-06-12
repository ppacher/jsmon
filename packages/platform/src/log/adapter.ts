import {Provider} from '@jsmon/core';

export const LoggingAdapter = 'HomebotLoggingAdapter';
export type LogLevel = 'debug'|'info'|'warn'|'error';

export interface LoggingAdapter {
    log(level: LogLevel, name: string,msg: string, ...args: any[]): void;
}

export function useLoggingAdapter(l: LoggingAdapter): Provider {
    return {
        provide: LoggingAdapter,
        useValue: l,
    };
}