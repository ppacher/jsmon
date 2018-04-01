import {Injectable, Provider} from '@homebot/core';

@Injectable()
export class MPDConfig {
    constructor(
        public readonly address: string = 'localhost',
        public readonly port: number = 6600,
        public readonly username?: string,
        public readonly password?: string,  
    ) {} 
    
    static provide(cfg: MPDConfig) {
        return {
            provide: MPD_CONFIG,
            useValue: cfg,
        };
    }
    
    static new(address?: string, port?: number, username?: string, password?: string): Provider {
        return {
            provide: MPD_CONFIG,
            useValue: new MPDConfig(address, port, username, password),
        };
    }
}

export const MPD_CONFIG = new class<MPDConfig> {
    toString(): string {
        return 'MPD_CONFIG';
    }
}();
