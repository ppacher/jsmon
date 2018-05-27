import {Injectable} from '@homebot/core';
import {DeviceManager, DeviceController, SensorSchema, Logger} from '@homebot/platform';
import * as api from '@homebot/platform/devices/api';
import {MqttDeviceAPI} from '../device.api';

import {filter, takeUntil} from 'rxjs/operators';

@Injectable()
export class MqttDeviceManagerAPI {
    constructor(
        private _manager: DeviceManager,
        private _api: MqttDeviceAPI,
    ){
        this._api.setupDiscoveryHandler(() => this._handleDiscoveryRequest());
        
        this._manager.registrations
            .subscribe(d => this._setupDevice(d));
    }

    private _setupDevice(d: DeviceController): void {
        const until = this._manager.unregistrations
            .pipe(filter(u => u.name === d.name));

        d.getSensorSchemas()
            .forEach(s => {
                d.watchSensor(s.name)
                    .pipe(takeUntil(until))
                    .subscribe(value => this._publishSensor(d, s.name, value));
            });
            
        d.commands.forEach(cmd => this._api.setupDeviceControllerCommand(d, cmd.name));

        this._publishDevice(d);
    }
    
    private _publishDevice(d: DeviceController):void {
        this._api.announceDevice(d);
    }
    
    private _publishSensor(d: DeviceController, sensor: string, value: any): void {
        this._api.publishSensorValue(d, sensor, value);
    }
    
    private async _handleDiscoveryRequest() {
        return this._manager.getRegisteredDevices();
    }
}
