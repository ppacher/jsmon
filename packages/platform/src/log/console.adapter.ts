import {Inject, Optional} from '@homebot/core';
import {LoggingAdapter, LogLevel} from './adapter';


enum TerminalColor {
    Reset = "\x1b[0m",
    Bright = "\x1b[1m",
    Dim = "\x1b[2m",
    Underscore = "\x1b[4m",
    Blink = "\x1b[5m",
    Reverse = "\x1b[7m",
    Hidden = "\x1b[8m",

    FgBlack = "\x1b[30m",
    FgRed = "\x1b[31m",
    FgGreen = "\x1b[32m",
    FgYellow = "\x1b[33m",
    FgBlue = "\x1b[34m",
    FgMagenta = "\x1b[35m",
    FgCyan = "\x1b[36m",
    FgWhite = "\x1b[37m",

    BgBlack = "\x1b[40m",
    BgRed = "\x1b[41m",
    BgGreen = "\x1b[42m",
    BgYellow = "\x1b[43m",
    BgBlue = "\x1b[44m",
    BgMagenta = "\x1b[45m",
    BgCyan = "\x1b[46m",
    BgWhite = "\x1b[47m",
}

export class ConsoleAdapterLoggingConfig {
    readonly colorMap: {
        [key: string]: string[];
    } = {
        'debug': [TerminalColor.FgWhite, TerminalColor.Dim],
        'info': [TerminalColor.FgGreen, TerminalColor.Bright],
        'warn': [TerminalColor.FgYellow],
        'error': [TerminalColor.FgRed, TerminalColor.Bright]
    };

    format = '[{{level}}] {{name}} -> {{msg}}';
    
    formatLevel(level: LogLevel, text: string): string {
        let def = this.colorMap[level];
        let color = '';
        let reset = '';
        
        if (def !== undefined && def.length > 0) {
            color = def.join('');
            reset = TerminalColor.Reset;
        }
        
        return `${color}${text}${reset}`;
    }
    
    formatName(name: string): string {
        return `${TerminalColor.Bright}${TerminalColor.FgWhite}${name}${TerminalColor.Reset}`;
    }

    formatMessage(level: LogLevel, text: string): string {
        return text;
    }
}

export class ConsoleAdapter implements LoggingAdapter {
    private _isTTY: boolean;
    private _config: ConsoleAdapterLoggingConfig;
    
    private levelName = {
        'debug': 'DBG',
        'info': 'INF',
        'warn': 'WRN',
        'error': 'ERR'
    }

    constructor(@Optional() config?: ConsoleAdapterLoggingConfig) {
        this._isTTY = Boolean(process.stdout.isTTY);
        
        if (!config) {
            this._config = new ConsoleAdapterLoggingConfig();
        } else {
            this._config = config;
        }
    }
    
    log(level: LogLevel, name: string, msg: string, ...args: any[]): void {
        let m = `${msg} ${args.length > 0 ? JSON.stringify(args) : ''}`;

        if (this._isTTY) {
            let lvl = this._config.formatLevel(level, this.levelName[level]);
            let n = this._config.formatName(name);
            m = this._config.formatMessage(level, m);
            
            console.log(this.format(lvl, n, m));
        } else {
            console.log(this.format(level, name, m));
        }
    }
    
    format(level: string, name: string, msg: string): string {
        let f = this._config.format;

        f = f.replace('{{name}}', name)
             .replace('{{level}}', level)
             .replace('{{msg}}', msg);
             
        return f;
    }
}