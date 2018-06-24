import {Injectable} from '@jsmon/core';
import {Logger, DeviceController, CommandSchema} from '@jsmon/platform';
import {IDeviceDefinition, DeviceDefinition, ICommandDefinition, DeviceDiscoveryAnnouncement, IDeviceDiscoveryAnnouncement} from '@jsmon/platform/proto';

import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import {tap, map, catchError} from 'rxjs/operators';
import {_throw} from 'rxjs/observable/throw';
import {toPromise} from 'rxjs/operator/toPromise';

import {MqttService, CommandHandler} from './mqtt.service';

export interface DiscoveryHandler {
    (): Promise<(IDeviceDiscoveryAnnouncement|DeviceController)[]>;
}

@Injectable()
export class MqttDeviceAPI {
    private _discoveryHandler: DiscoveryHandler|null = null;
    private _discoverySubscription: Subscription|null = null;
    private _discoveryRequests: Observable<[string, Buffer]>;
    private _log: Logger;

    constructor(private _mqtt: MqttService, log: Logger) {
        this._log = log.createChild('mqtt:device');
        
        this._discoveryRequests = this._mqtt.subscribe('jsmon/discovery');
    }
    
    /**
     * Register a discovery request handler invoked for each discovery request
     * The request handler may return one or more {@link @jsmon/core/device-manager/api:DeviceMessage} or 
     * a {@link @jsmon/core/device-manager:DeviceController} to be published on MQTT
     * 
     * @param handler The handler function to invoke for each discovery request
     */
    setupDiscoveryHandler(handler: DiscoveryHandler|null): void {
        this._discoveryHandler = handler;
        
        if (handler === null) {
            if (!!this._discoverySubscription) {
                this._discoverySubscription.unsubscribe();
                this._discoverySubscription = null;
            }

            return;
        }
        
        this._subscribeDiscovery();
    }

    /**
     * Publish a device discovery request on MQTT
     */
    initiateDiscovery(): void {
        this._mqtt.publish('jsmon/discovery', null);
    }
    
    /**
     * Announces the availablility of a device on MQTT
     * 
     * @param device The {@link @jsmon/core:DeviceController} or {@link @jsmon/core:api.DeviceMessage} to publish
     */
    announceDevice(device: DeviceController|IDeviceDiscoveryAnnouncement) {
        if (!device) {
            return;
        }
        
        let msg: IDeviceDiscoveryAnnouncement;
        
        if (device instanceof DeviceController) {
            msg = {
                device: {
                    name: device.name,
                    description: device.description,
                    sensors: device.getSensorSchemas(),
                    commands: device.getCommandDefinitions() as ICommandDefinition[],
                },
                sensorValues: device.getSensorSchemas().map(sensor => ({
                    sensorName: sensor.name,
                    type: sensor.type,
                    deviceName: device.name,
                    value: JSON.stringify(device.getSensorValue(sensor.name)),
                }))
            };
        } else {
            msg = device;
        }

        let payload = DeviceDiscoveryAnnouncement.encode(msg).finish();
        
        this._mqtt.publish(`jsmon/device/${msg.device.name}`, new Buffer(payload));
    }
    
    /**
     * Setup a listener for device annoucements
     */
    watchDeviceAnnouncements(): Observable<IDeviceDiscoveryAnnouncement> {
        return this._mqtt.subscribe(`jsmon/device/+`)
            .pipe(
                map(([topic, buffer]) => DeviceDiscoveryAnnouncement.decode(buffer))
            );
    }
    
    /**
     * Publish a new sensor value on MQTT
     * 
     * @param deviceOrName  The {@link DeviceController} or name of the device
     * @param sensor        The name of the {@link Sensor} 
     * @param value         The value of the sensor to publish 
     */
    publishSensorValue(deviceOrName: DeviceController|string, sensor: string, value: any): void {
        if (value === undefined) {
            return;
        }
        const name = deviceOrName instanceof DeviceController ? deviceOrName.name : deviceOrName;
        const payload = JSON.stringify(value);
        
        this._log.debug(`publishing sensor value for ${name}.${sensor}`, value)

        this._mqtt.publish(`jsmon/device/${name}/sensor/${sensor}/value`, payload);
    }
    
    /**
     * Start watching values of a given device sensor
     * 
     * @param deviceName The name of the device the sensor belongs to
     * @param sensorName The name of the sensor to watch values
     *
     * @returns An {@link Observable} that emits the current sensor value when received
     */
    watchSensor(deviceName: string, sensorName: string): Observable<any> {
        return this._mqtt.subscribe(`jsmon/device/${deviceName}/sensor/${sensorName}/value`)
            .pipe(
                map(([topic, buffer]) => JSON.parse(buffer.toString())),
                tap((value) => this._log.debug(`Received sensor value for ${deviceName}/${sensorName}`, value))
            );
    }
    
    call(device: string, cmd: string, params: Map<string, any>|{[key: string]: any}): Promise<any> {
        let body: {[key: string]: any} = {};
        
        if (params instanceof Map) {
            Array.from(params.keys()).forEach(key => {
                body[key] = params.get(key);
            });
        } else {
            body = params;
        }

        const payload = JSON.stringify(body);
        return toPromise.apply(
            this._mqtt.call(`jsmon/device/${device}/command/${cmd}`, payload, 5*1000)
                .pipe(
                    map(b => b.toString()),
                    map(d => !!d && d.length > 0 ? JSON.parse(d) : undefined),
                    catchError((err: any) => {
                        this._log.error(`Caught error during RPC ${device}.${cmd}: ${err.toString()}`);
                        
                        let msg = err.toString();

                        if (err instanceof Error) {
                            msg = err.message;
                        } else
                        if ('message' in err) {
                            msg = err.message;
                        } else
                        if ('error' in err) {
                            msg = err.error;
                        }
                        
                        return _throw(msg);
                    })
                )
        );
    }
    
    /**
     * Expose a device command over MQTT
     * 
     * @param device The {@link DeviceController} that supports the command
     * @param cmdName The name of the command that should be exposed over MQTT
     */
    setupDeviceControllerCommand(device: DeviceController, cmdName: string): Subscription {
        let cmd: ICommandDefinition = device.getCommandDefinitions().find(cmd => cmd.name === cmdName);
        
        if (cmd === undefined) {
            throw new Error(`Device ${device.name} does not have a command handler for ${cmdName}`);
        }

        return this._setupCommandHandler(device.name, cmdName, (b: Buffer) => {
            let payload = b.toString();
            let body = {};

            if (payload !== '') {
                body = JSON.parse(payload);
            }
            
            let params: Map<string, any> = new Map();
            Object.keys(body).forEach(key => {
                params.set(key, body[key]);
            });
            

            return device.call(cmd.name, params)
                .toPromise()
                .then(res => {
                    if (res === undefined) {
                        return new Buffer('');
                    }
                    return new Buffer(JSON.stringify(res));
                });
        });
    }
    
    /**
     * Setup a custom handler for a device command
     * 
     * @param deviceName The name of the device
     * @param cmdName    The name of the command to expose 
     * @param handler    The handler function to invoke for each command request 
     */
    setupDeviceCommandHandler(deviceName: string, cmdName: string, handler: CommandHandler): Subscription {
        return this._setupCommandHandler(deviceName, cmdName, handler);
    }
    
    private _subscribeDiscovery(): void {
        this._discoverySubscription = this._discoveryRequests
            .subscribe(([topic, buffer]) => this._handleDiscovery(topic, buffer));
    }
    
    private async _handleDiscovery(topic: string, buffer: Buffer) {
        if (!!this._discoveryHandler) {
            let devices = await this._discoveryHandler();
            if (!Array.isArray(devices)) {
                devices = [devices];
            }
            
            devices.forEach(d => this.announceDevice(d));
        }
    }

    private _setupCommandHandler(deviceName: string, cmdName: string, handler: CommandHandler): Subscription {
        return this._mqtt.handle(`jsmon/device/${deviceName}/command/${cmdName}`, handler);
    }
}

