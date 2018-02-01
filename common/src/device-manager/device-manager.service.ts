import {Injectable} from '@homebot/core';
import {Request} from 'restify';
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
        return `${this.getDeviceBaseURL(d)}/command/${cmd.name}`;
    }
    
    /**
     * Returns the URL for a device sensor
     */
    getDeviceSensorURL(d: Device.Device, sensor: Device.SensorSchema): string {
        return `${this.getDeviceBaseURL(d)}/sensors/${sensor.name}`;
    }

    /** Returns the base URL for the device manager */
    getBaseURL(): string {
        return this._BASE_URL;
    }
    
    /**
     * Registers all routes for a given device
     * 
     * @param device  The device to register routes for
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
                })),
                sensors: device.getSensorSchemas()
            };

            res.send(response);
        });
        
        let allSensors = this._server.register('get', this.getDeviceSensorURL(device, {name:''} as any), (req, res) => {
            const values = device.getSensorValues();
            const response = device.getSensorSchemas()
                .map(sensor => {
                    return  {...sensor, value: values[sensor.name]};
                });
            
            res.send(response);
        });
        cancelFns.push(allSensors);
        
        // Setup routes for sensors
        device.getSensorSchemas().forEach(sensor => {
            const url = this.getDeviceSensorURL(device, sensor);

            const cancelGet = this._server.register('get', url, (req, res) => {
                const response = {...sensor, value: device.getSensorValue(sensor.name)};
                
                res.send(response);
            });
            
            cancelFns.push(cancelGet);
        });
        
        // Setup routes for commands
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
                let parameters = this._parseRequestParameters(cmd, req);

                device.call(cmd.name, parameters)
                    .subscribe(
                        (result) => res.send(result),
                        (err) => res.send(err));
            });
            cancelFns.push(cancelPost);
        });
        
        cancelFns.push(getter);

        return () => {
            cancelFns.forEach(cancel => cancel());
        };
    }
    
    private _parseRequestParameters(cmd: Device.CommandSchema, req: Request): Map<string, any> {
        const params = new Map<string, any>();
        
        if (req.getContentType() !== 'application/json') {
            throw new Error(`Invalid content type. Accpected application json`);
        }
        
        if (typeof req.body !== 'object') {
            throw new Error(`Invalid request parameter type. Expected a JSON object`);
        }
        
        Object.keys(req.body).forEach(key => {
            let value = req.body[key];

            params.set(key, value);
        });
        
        return params;
    }
}