import {Injectable} from '@homebot/core';
import {DeviceManager, DeviceController, ParameterDefinition, Logger} from '@homebot/platform';
import * as api from '@homebot/platform/devices/api';
import {MqttDeviceAPI} from '../device.api';

import {_throw} from 'rxjs/observable/throw';
import {map, catchError, publishBehavior} from 'rxjs/operators';
import {toPromise} from 'rxjs/operator/toPromise';

@Injectable()
export class MqttDeviceManagerProxy {
    constructor(
        private _api: MqttDeviceAPI,
        private _manager: DeviceManager,
        private _log: Logger
    ) {
        this._api.watchDeviceAnnouncements()
            .subscribe(device => this._handleDiscovery(device));
            
        this._api.initiateDiscovery();
    }
    
    public discover(): void {
        this._api.initiateDiscovery();
    }
    
    private _handleDiscovery(device: api.DeviceMessage): void {
        const registeredDevices = this._manager.getRegisteredDevices();
        const isKnownDevice = (name: string) => registeredDevices.find(d => d.name === name);

        if (!isKnownDevice(device.name)) {
            this._log.info(`Registered a new device for ${device.name}`);
            this._registerDevice(device);
        } else {
            this._log.info(`Device ${device.name} already handled`);
        }
    }
    
    private _registerDevice(d: api.DeviceMessage): void {
        const controller = new DeviceController(
            d.name,
            null,
            d.commands.map(cmd => {
                return {
                    name: cmd.name,
                    parameters: cmd.parameters as any,
                    handler: (params: Map<string, any>) => {
                        this._log.info(`[mqtt] sending RPC for ${d.name}.${cmd.name} with ${params.size} parameters`);
                        
                        return this._api.call(d.name, cmd.name, params);
                    }
                };
            }),
            d.sensors.map(sensor => {
                return {
                    name: sensor.name,
                    type: sensor.type,
                    description: sensor.description,
                    onChange: this._api.watchSensor(d.name, sensor.name)
                        .pipe(
                            publishBehavior(sensor.value)
                        )
                }
            })
        );

        this._manager.registerDeviceController(controller);
    }
}