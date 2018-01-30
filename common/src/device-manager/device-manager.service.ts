import {Injectable} from '@homebot/core';

import {Device} from './controller';

import {HTTPServer, RemoveRouteFn} from '../http/server';

const _BASE_URL = '/devices';

interface DeviceRegistration {
    device: Device.Device;
    unregisterRoute: RemoveRouteFn;
}

@Injectable()
export class DeviceManager {
    /** A list of devices currently registered in the manager */
    private readonly _devices = new Map<string, DeviceRegistration>();
    
    /** The base URl of the device manager */
    private readonly _BASE_URL = _BASE_URL;
    
    private _disposeRoutes: RemoveRouteFn;
    
    // TODO(ppacher): add injection token for _BASE_URL
    constructor(private _server: HTTPServer) {
        this._disposeRoutes = this._server.register('get', `${this._BASE_URL}/`, (req, resp) => {
            let response = Array.from(this._devices.values())
                .map(device => {
                    return {
                        name: device.device.name,
                        description: device.device.description,
                        state: device.device.healthy(),
                        commands: device.device.commands.map(cmd => ({
                            name: cmd.name,
                        }))
                    };
                });
                
            resp.send(response);
        });
    } 
    
    /**
     * Registers a new device at the device manager
     * 
     * @param def  The {@link Device.Device} definition of the new device
     */
    registerDevice(def: Device.Device): void {
        if (this._devices.has(def.name)) {
            throw new Error(`Failed to register device ${def.name}. Name already used`);
        }
        
        const cancel = this._registerDeviceRoutes(def);
        
        this._devices.set(def.name, {
            device: def,
            unregisterRoute: cancel,
        });
        
        console.log(`Registered device ${def.name} with ${def.commands.length} cmds`);
    }
    
    /**
     * Unregisteres a device from the device manager
     * 
     * @param def  The {@link Device.Device} definition or the name of the device
     */
    unregisterDevice(def: Device.Device|string): void {
        let name: string;

        if (def instanceof Device.Device) {
            name = def.name;
        } else {
            name = def;
        }
        
        if (this._devices.has(name)) {
            const meta = this._devices.get(name);
            this._devices.delete(name);
            meta.unregisterRoute();
            
            return;
        }

        throw new Error(`Unknown device ${name}`);
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
    
    /**
     * Generates a base URL for a given device
     * 
     * @param d The device to generate the base URL for
     */ 
    getDeviceBaseURL(d: Device.Device): string {
        return `${this._BASE_URL}/${d.name}`;
    }
    
    /**
     * Returns the URL for a device command
     */
    getDeviceCommandURL(d: Device.Device, cmd: Device.CommandSchema): string {
        return `${this.getDeviceBaseURL(d)}/${cmd.name}`;
    }

    /** Returns the base URL for the device manager */
    getBaseURL(): string {
        return this._BASE_URL;
    }
    
    /**
     * Registers all routes for a given decoy
     * 
     * @param device  The decoy to register routes for
     * @return A function to remove all routes registered
     */
    private _registerDeviceRoutes(device: Device.Device): RemoveRouteFn {
        let cancelFns: RemoveRouteFn[] = [];
        const getter = this._server.register('get', this.getDeviceBaseURL(device), (req, res) => {
            const response = {
                name: device.name,
                description: device.description,
                state: device.healthy(),
                commands: device.commands.map(cmd => ({
                    name: cmd.name,
                }))
            };

            res.send(response);
        });
        
        device.commands.forEach((cmd) => {
            const url = this.getDeviceCommandURL(device, cmd);

            const cancelGet = this._server.register('get', url, (req, res) => {
                const response = Object.keys(cmd.parameters)
                    .map(name => {
                        let def = cmd.parameters[name];
                        let types = Array.isArray(def) ? def : def.types;
                        let optional = Array.isArray(def) ? false : def.optional;
                        let help = Array.isArray(def) ? '' : def.help || '';
                        
                        return {
                            name: name,
                            types: types,
                            optional: optional,
                            help: help,
                        };
                    });
                    
                res.send(response);
            });
            cancelFns.push(cancelGet);
            
            const cancelPost = this._server.register('post', url, (req, res) => {
                cmd.handler(new Map()).then((res) => {
                    res.send({result: res, error: 'none'});
                }).catch(err => res.send(err));
            });
            cancelFns.push(cancelPost);
        });
        
        cancelFns.push(getter);

        return () => {
            cancelFns.forEach(cancel => cancel());
        };
    }
}