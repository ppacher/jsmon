import { Optional, Injectable, Type, Injector, Provider, isDestroyable } from '@homebot/core';
import { isPromiseLike, isObservableLike, stringify } from '@homebot/core/utils';

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
import {Logger} from '../log';

import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';

import {_throw} from 'rxjs/observable/throw';
import 'rxjs/add/operator/takeUntil';

const _BASE_URL = '/devices';

@Injectable()
export class DeviceManager {
    /** A list of devices currently registered in the manager */
    private readonly _devices = new Map<string, DeviceController>();
    
    /** The base URl of the device manager */
    private readonly _BASE_URL = _BASE_URL;
    
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
        let dev = this._devices.get(device);
        if (dev === undefined) {
            return _throw(new Error(`Unknown device ${device}`));
        }
        
        return dev.watchSensors()
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
        let dev = this._devices.get(device);
        if (dev === undefined) {
            return _throw(new Error(`Unknown device ${device}`))
        }
        
        return dev.watchSensor(sensor)
            .takeUntil(this.onDeviceUnregistration([device]));
    }
    
    constructor(private _injector: Injector, @Optional() private _logger?: Logger) {
        if (!this._logger) {
            this._logger = new Logger(undefined, 'device');
        } else {
            this._logger = this._logger.createChild('device');
        }
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
    setupDevice<T>(name: string, deviceClass: Type<T>, description?: string, providers?: Provider|Provider[], parentInjector?: Injector): DeviceController<T> {
        const metadata = getDeviceMetadata(deviceClass);
        const commands = getPropertyMetadata(deviceClass);
        const injector = this._setupDeviceInjector(name, deviceClass, providers || [], parentInjector); 
        
        description = description || (metadata.description || '');
        
        const instance = injector.get<any>(deviceClass);
        const commandSchemas: CommandSchema[] = Object.keys(commands)
            .filter(key => !!commands[key] && commands[key].length > 0)
            .filter(key => commands[key].find(def => def instanceof Command) !== undefined)
            .map(key => {
                const def: Command = (commands[key].find(def => def instanceof Command) as Command)!;

                return {
                    name: def.name,
                    parameters: def.parameters || {},
                    handler: instance[key],
                    description: def.description,
                };
            });
        
        const sensorProviders: SensorProvider[] = Object.keys(commands)
            .filter(key => !!commands[key] && commands[key].length > 0)
            .filter(key => commands[key].find(def => def instanceof Sensor) !== undefined)
            .map(key => {
                const def = commands[key].find(def => def instanceof Sensor) as Sensor;
                
                return {
                    ...def,
                    onChange: instance[key]
                };
            });
        
        const controller = new DeviceController(name, instance, commandSchemas, sensorProviders, injector, undefined, description);
        
        injector.addOnDispose(() => this._disposeController(controller));
        
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
        
        this._devices.set(def.name, def);
        
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
            const dev = this._devices.get(name)!;
            this._devices.delete(name);

            this._unregistrations.next(dev);
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
    
    private _disposeController(def: DeviceController): void {
        try { this.unregisterDeviceController(def); } 
            catch(err) {}

        if (isDestroyable(def)) {
            def.onDestroy();
        }
    }
    
    private _setupDeviceInjector(name: string, deviceClass: Type<any>, providers: Provider|Provider[], parentInjector: Injector = this._injector): Injector {
        if (!Array.isArray(providers)) {
            providers = [providers];
        }
        
        let logger = {
            provide: Logger,
            useValue: this._logger!.createChild(name)
        }
        
        return new Injector([...providers, deviceClass, logger], this._injector);
    }
}