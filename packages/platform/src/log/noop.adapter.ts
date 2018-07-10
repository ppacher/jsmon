import {LoggingAdapter, LogLevel} from './adapter';

export class NoopLogAdapter implements LoggingAdapter {
    log(level: LogLevel, name: string, msg: string, ...args: any[]): void {
        // Nop
    }
}