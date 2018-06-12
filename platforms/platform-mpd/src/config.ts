import {Injectable, Provider} from '@jsmon/core';

@Injectable()
export class MPDConfig {
    constructor(
        public readonly address: string = 'localhost',
        public readonly port: number = 6600,
        public readonly interval: number = 5 * 1000, // Default 5 seconds
        public readonly username?: string,
        public readonly password?: string,
    ) {} 
    
    static provide(cfg: MPDConfig) {
        return {
            provide: MPD_CONFIG,
            useValue: cfg,
        };
    }
    
    static new(address?: string, port?: number, interval?: number, username?: string, password?: string): Provider {
        return {
            provide: MPD_CONFIG,
            useValue: new MPDConfig(address, port, interval, username, password),
        };
    }
}

export const MPD_CONFIG = new class<MPDConfig> {
    toString(): string {
        return 'MPD_CONFIG';
    }
}();
