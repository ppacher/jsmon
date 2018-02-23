import {Injectable, DeviceManager, DeviceController} from '@homebot/core';
import {HTTPServer} from '../server';
import {DeviceHttpApiConfig} from './config';

@Injectable()
export class DeviceHttpApi {
    constructor(private _server: HTTPServer,
                private _manager: DeviceManager,
                public readonly config: DeviceHttpApiConfig) {
        this._setupRoutes();
    }
    
    private _setupRoutes(): void {
        this._manager.registrations
            .subscribe(device => this._setupDeviceRoute(device));
    } 
    
    private _setupDeviceRoute(d: DeviceController): void {
        const url = this.config.getDeviceRoute!(d); 
        
        console.log(`setting up device ${d.name} on ${url}`);
    }
}