import {Injectable, DeviceManager, DeviceController, ParameterDefinition} from '@homebot/core';
import * as api from '@homebot/core/device-manager/api';
import {MqttService} from '../mqtt.service';

import {map} from 'rxjs/operators';

@Injectable()
export class MqttDeviceManagerProxy {
    constructor(
        private _mqtt: MqttService,
        private _manager: DeviceManager
    ) {
        this._mqtt.subscribe('homebot/device/+')
            .subscribe(([topic, payload]) => this._handleDiscovery(topic, payload));
        this.discover(); 
    }
    
    public discover(): void {
        this._mqtt.publish('homebot/discovery', 'discover');
    }
    
    private _handleDiscovery(t: string, p: Buffer): void {
        let device: api.DeviceMessage = JSON.parse(p.toString());

        const registeredDevices = this._manager.getRegisteredDevices();
        const isKnownDevice = (name: string) => registeredDevices.find(d => d.name === name);

        if (!isKnownDevice(device.name)) {
            this._registerDevice(device);
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
                        return new Promise<any>((_, reject) => reject('not supported'));
                    }
                }
            }),
            d.sensors.map(sensor => {
                return {
                    name: sensor.name,
                    type: sensor.type,
                    description: sensor.description,
                    onChange: this._mqtt.subscribe(`homebot/device/${d.name}/sensor/${sensor.name}`)
                        .pipe(map(([topic, v]: [string, Buffer]) => JSON.parse(v.toString()).value))
                }
            })
        )
    }
}