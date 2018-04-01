import {Provider} from '@homebot/core';
import {DeviceController} from '@homebot/platform';

export class DeviceHttpApiConfig {
    constructor(
        public readonly BASE_URL: string = '/api/devices',
        public getDeviceRoute?: (d: DeviceController) => string,
    ) {
        if (this.getDeviceRoute === undefined) {
            this.getDeviceRoute = this.defaultGetDeviceRoute;
        }
    } 
    
    public defaultGetDeviceRoute(d: DeviceController): string {
        return `${this.BASE_URL}/${d.name}`;
    }
    
    static provideConfig(cfg: DeviceHttpApiConfig): Provider {
        return {
            provide: DeviceHttpApiConfig,
            useValue: cfg,
        };
    }
}