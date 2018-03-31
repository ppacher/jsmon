import {Injectable, DeviceController, CommandSchema} from '@homebot/core';
import * as api from '@homebot/core/device-manager/api';

import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operators';

import {MqttService, CommandHandler} from './mqtt.service';

export interface DiscoveryHandler {
    (): Promise<(api.DeviceMessage|api.DeviceMessage|DeviceController)[]>;
}

@Injectable()
export class MqttDeviceAPI {
    private _discoveryHandler: DiscoveryHandler|null = null;
    private _discoverySubscription: Subscription|null = null;
    private _discoveryRequests: Observable<[string, Buffer]>;

    constructor(private _mqtt: MqttService) {
        this._discoveryRequests = this._mqtt.subscribe('homebot/discovery');
    }
    
    /**
     * Register a discovery request handler invoked for each discovery request
     * The request handler may return one or more {@link @homebot/core/device-manager/api:DeviceMessage} or 
     * a {@link @homebot/core/device-manager:DeviceController} to be published on MQTT
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
     * Announces the availablility of a device on MQTT
     * 
     * @param device The {@link @homebot/core:DeviceController} or {@link @homebot/core:api.DeviceMessage} to publish
     */
    announceDevice(device: api.DeviceMessage|DeviceController) {
        if (!device) {
            return;
        }
        
        let msg: api.DeviceMessage;
        if (device instanceof DeviceController) {
            msg = {
                name: device.name,
                description: device.description,
                sensors: device.getSensorSchemas().map(s => {
                    return {
                        ...s,
                    };
                }),
                commands: device.commands.map(cmd => {
                    return {
                        name: cmd.name,
                        description: cmd.description,
                        parameter: cmd.parameters
                    }  
                }),
            };
        } else {
            msg = device;
        }
        
        const payload = JSON.stringify(msg);
        this._mqtt.publish(`homebot/device/${device.name}`, payload);
    }
    
    /**
     * Setup a listener for device annoucements
     */
    watchDeviceAnnouncements(): Observable<api.DeviceMessage> {
        return this._mqtt.subscribe(`homebot/device/+`)
            .pipe(
                map(([topic, buffer]) => JSON.parse(buffer.toString()))
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
        const name = deviceOrName instanceof DeviceController ? deviceOrName.name : deviceOrName;
        const payload = JSON.stringify(value);

        this._mqtt.publish(`homebot/device/${name}/sensor/${name}/value`, payload);
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
        return this._mqtt.subscribe(`homebot/device/${name}/sensor/${name}/value`)
            .pipe(
                map(([topic, buffer]) => JSON.parse(buffer.toString()))
            );
    }
    
    /**
     * Expose a device command over MQTT
     * 
     * @param device The {@link DeviceController} that supports the command
     * @param cmdName The name of the command that should be exposed over MQTT
     */
    setupDeviceControllerCommand(device: DeviceController, cmdName: string): Subscription {
        let cmd: CommandSchema = device.commands.find(cmd => cmd.name === cmdName);
        
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
            
            return cmd.handler.apply(device.instance, [params])
                .then(res => {
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
        return this._mqtt.handle(`homebot/device/${deviceName}/command/${cmdName}`, handler);
    }
}

