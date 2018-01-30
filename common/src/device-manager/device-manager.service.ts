import {Injectable} from '@homebot/core';

import {Device} from './controller';

import {HTTPServer} from '../http/server';

@Injectable()
export class DeviceManager {
    constructor(private _server: HTTPServer) {} 
    
    /**
     * Registers a new device at the device manager
     * 
     * @param def  The {@link Device.Device} definition of the new device
     */
    registerDevice(def: Device.Device): void {
        throw new Error('not yet implemented');
    }
    
    /**
     * Unregisteres a device from the device manager
     * 
     * @param def  The {@link Device.Device} definition or the name of the device
     */
    unregisterDevice(def: Device.Device|string): void {
        throw new Error('not yet implemented');
    }
    
    /**
     * Unregisteres a device from the device manager
     * Acutally an alias for `unregister`
     * 
     * @param def  The {@link Device.Device} definition or the name of the device
     */
    deregisterDevice(def: Device.Device|string): void {
        this.unregisterDevice(def);
    }
}