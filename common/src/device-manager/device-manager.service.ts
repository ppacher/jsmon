import {
    Injectable,
    Type,
    ReflectiveInjector,
    Provider,
    isPromiseLike,
    isObservableLike,
    stringify,
    getDiMetadataName
} from '@homebot/core';
import {Request} from 'restify';
import {
    SensorProvider,
    Sensor,
    Command,
    CommandSchema,
    SensorSchema,
    getDeviceMetadata,
    getPropertyMetadata
} from './device';
import {DeviceController} from './device-controller';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';

import {_throw} from 'rxjs/observable/throw';
import 'rxjs/add/operator/takeUntil';

import {HTTPServer, RemoveRouteFn} from '../http/server';

const _BASE_URL = '/devices';

interface DeviceRegistration {
    device: DeviceController;
    unregisterRoute: RemoveRouteFn;
}

@Injectable()
export class DeviceManager {
    /** A list of devices currently registered in the manager */
    private readonly _devices = new Map<string, DeviceRegistration>();
    
    /** The base URl of the device manager */
    private readonly _BASE_URL = _BASE_URL;
    
    private _disposeRoutes: RemoveRouteFn;
    
    /** Subject used to emit newly registered device controllers */
    private readonly _registrations = new Subject<DeviceController>();
    
    /** Subject used to emit device controller that have been unregistered */
    private readonly _unregistrations = new Subject<DeviceController>();
    
    /** Emits a device controller whenever a new device has been registered */
    get registrations(): Observable<DeviceController> { 
        return this._registrations.asObservable();
    }
    
    /** Emits a device controller whenever a device has been unregistered */
    get unregistrations(): Observable<DeviceController> { 
        return this._unregistrations.asObservable();
    }
    
    /** Returns a list of currently registered devices */
    getRegisteredDevices(): DeviceController[] {
        return Array.from(this._devices.values());
    }
    
    /**
     * Returns an observable that emits whenever on of the specified
     * devices is registered
     *
     * @param devices A list of device names to emit when registered
     */
    onDeviceRegistration(devices: string[]): Observable<DeviceController> {
        return this.registrations
            .filter(dev => devices.includes(dev.name));
    }
    
    /** 
     * Returns an observable that emits when ever on of the specified
     * devices is unregistered
     *
     * @param devices A list of device names to emit when unregistered
     */
    onDeviceUnregistration(devices: string[]): Observable<DeviceController> {
        return this.unregistrations
            .filter(dev => devices.includes(dev.name));
    }
    
    /**
     * Returns an observable that emits whenever on of the given
     * device sensor receives a new value.
     * 
     * The returned observable is automatically completed once
     * the device is unregistered
     *
     * @param device The name of the device to watch sensors
     */
    watchSensors(device: string): Observable<{[key: string]:any}> {
        let meta = this._devices.get(device);
        if (meta === undefined) {
            return _throw(new Error(`Unknown device ${device}`));
        }
        
        return meta.device.watchSensors()
            .takeUntil(this.onDeviceUnregistration([device]));
    }
    
    /**
     * Returns an observable that emits whenever the given sensor
     * value changes for the selected device
     * 
     * The returned observable is automatically completed once
     * the device is unregistered
     * 
     * @param device The name of the device
     * @param sensor The name of the sensor within the device
     */
    watchSensor(device: string, sensor: string): Observable<any> {
        let meta = this._devices.get(device);
        if (meta === undefined) {
            return _throw(new Error(`Unknown device ${device}`))
        }
        
        return meta.device.watchSensor(sensor)
            .takeUntil(this.onDeviceUnregistration([device]));
    }
    
    // TODO(ppacher): add injection token for _BASE_URL
    constructor(private _server: HTTPServer,
                private _injector: ReflectiveInjector) {
                
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
     * Setup and register a new device controller
     * 
     * @param name          The name of the device to setup
     * @param deviceClass   The device class
     * @param description   An optional description for the device. If set, it will override the
     *                      description from the device metadata decorator
     * @param providers     An optional set of one or more providers for the device injector
     */
    setupDevice(name: string, deviceClass: Type<any>, description?: string, providers?: Provider|Provider[]): DeviceController {
        const metadata = getDeviceMetadata(deviceClass);
        const commands = getPropertyMetadata(deviceClass);
        const injector = this._setupDeviceInjector(deviceClass, providers); 
        
        description = description || (metadata.description || '');
        
        const instance = injector.get(deviceClass);
        const commandSchemas: CommandSchema[] = Object.keys(commands)
            .filter(key => !!commands[key] && commands[key].length > 0)
            .filter(key => commands[key].find(def => def instanceof Command || getDiMetadataName(def) === 'Command') !== undefined)
            .map(key => {
                const def = commands[key].find(def => def instanceof Command || getDiMetadataName(def) === 'Command') as Command;
                
                /* TODO(ppacher): currently not working
                
                if (!isObservableLike(instance[key])) {
                    throw new Error(`Sensors must be of type ObservableLike`);
                }
                */

                return {
                    name: def.name,
                    parameters: def.parameters,
                    handler: instance[key],
                    description: def.description,
                };
            });
        
        const sensorProviders: SensorProvider[] = Object.keys(commands)
            .filter(key => !!commands[key] && commands[key].length > 0)
            .filter(key => commands[key].find(def => def instanceof Sensor || getDiMetadataName(def) === 'Sensor') !== undefined)
            .map(key => {
                const def = commands[key].find(def => def instanceof Sensor || getDiMetadataName(def) === 'Sensor') as Sensor;
                
                return {
                    ...def,
                    onChange: instance[key]
                };
            });
        
        const controller = new DeviceController(name, commandSchemas, sensorProviders, undefined, description);
        
        this.registerDeviceController(controller);

        return controller;
    }
    
    /**
     * Registers a new device at the device manager
     * 
     * @param def  The {@link Device.Device} definition of the new device
     */
    registerDeviceController(def: DeviceController): void {
        if (this._devices.has(def.name)) {
            throw new Error(`Failed to register device ${def.name}. Name already used`);
        }
        
        const cancel = this._registerDeviceRoutes(def);
        
        this._devices.set(def.name, {
            device: def,
            unregisterRoute: cancel,
        });
        
        console.log(`Registered device ${def.name} with ${def.commands.length} cmds`);
        this._registrations.next(def);
    }
    
    /**
     * Unregisteres a device from the device manager
     * 
     * @param def  The {@link Device.Device} definition or the name of the device
     */
    unregisterDeviceController(def: DeviceController|string): void {
        let name: string;

        if (def instanceof DeviceController) {
            name = def.name;
        } else {
            name = def;
        }
        
        if (this._devices.has(name)) {
            const meta = this._devices.get(name);
            this._devices.delete(name);
            meta.unregisterRoute();
            
            this._unregistrations.next(meta.device);
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
    deregisterDeviceController(def: DeviceController|string): void {
        this.unregisterDeviceController(def);
    }
    
    /**
     * Generates a base URL for a given device
     * 
     * @param d The device to generate the base URL for
     */ 
    getDeviceBaseURL(d: DeviceController): string {
        return `${this._BASE_URL}/${d.name}`;
    }
    
    /**
     * Returns the URL for a device command
     *
     * @param d The device controller
     * @param cmd the command schema definition
     */
    getDeviceCommandURL(d: DeviceController, cmd: CommandSchema): string {
        return `${this.getDeviceBaseURL(d)}/command/${cmd.name}`;
    }
    
    /**
     * Returns the URL for a device sensor
     *
     * @param d The device controller
     * @param sensors the sensor schema definition
     */
    getDeviceSensorURL(d: DeviceController, sensor: SensorSchema): string {
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
    private _registerDeviceRoutes(device: DeviceController): RemoveRouteFn {
        let cancelFns: RemoveRouteFn[] = [];
        const getter = this._server.register('get', this.getDeviceBaseURL(device), (req, res) => {
            const response = {
                name: device.name,
                description: device.description,
                state: device.healthy(),
                commands: device.commands.map(cmd => ({
                    name: cmd.name,
                    description: cmd.description,
                    // TODO: add parameters
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
                let parameters: Map<string, any>;
                
                try {
                    parameters = this._parseRequestParameters(cmd, req);
                } catch (err) {
                    res.send(400, {'error': err.message});
                    return;
                }

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
    
    private _parseRequestParameters(cmd: CommandSchema, req: Request): Map<string, any> {
        const params = new Map<string, any>();
        
        const hasParams = !!cmd.parameters && Object.keys(cmd.parameters).length > 0;
        
        if (req.getContentType() !== 'application/json' && hasParams) {
            throw new Error(`Invalid content type. Accpected application json`);
        }
        
        if (!!req.body && !hasParams) {
            throw new Error('Command does not accept parameters');
        }

        if (!hasParams) {
            return params;
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
    
    private _setupDeviceInjector(deviceClass: Type<any>, providers: Provider|Provider[]): ReflectiveInjector {
        if (!Array.isArray(providers)) {
            providers = [providers];
        }
        
        return this._injector.resolveAndCreateChild([
            deviceClass,
            ...providers,
        ]);
    }
}