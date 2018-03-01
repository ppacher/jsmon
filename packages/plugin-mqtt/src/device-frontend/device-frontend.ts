import {Injectable, DeviceManager, DeviceController, SensorSchema} from '@homebot/core';
import * as api from '@homebot/core/device-manager/api';
import {MqttService} from '../mqtt.service';

@Injectable()
export class MqttDeviceAPI {
    constructor(
        private _manager: DeviceManager,
        private _mqtt: MqttService,
    ){
        this._mqtt.subscribe('homebot/discovery')
            .subscribe(([topic, payload]) => this._handleDiscoveryRequest(topic, payload));
        
        this._manager.registrations
            .subscribe(d => this._setupDevice(d));
    }

    private _setupDevice(d: DeviceController): void {
        const until = this._manager.unregistrations
            .filter(u => u.name === d.name);

        d.getSensorSchemas()
            .forEach(s => {
                d.watchSensor(s.name)
                    .takeUntil(until)
                    .subscribe(value => this._publishSensor(d, s.name, value));
            });

        this._publishDevice(d);
    }
    
    private _publishDevice(d: DeviceController):void {
        const msg: api.DeviceMessage = {
            name: d.name,
            description: d.description,
            sensors: d.getSensorSchemas(),
            commands: d.commands.map(cmd => {
                return {
                    name: cmd.name,
                    description: cmd.description,
                    parameter: cmd.parameters
                }  
            }),
        };
        
        this._mqtt.publish(`homebot/device/${d.name}`, JSON.stringify(msg, undefined, 4));
    }
    
    private _publishSensor(d: DeviceController, sensor: string, value: any): void {
        const schema = d.getSensorSchemas().find(s => s.name === sensor);

        console.log(`[mqtt] publishing sensor value for ${sensor}`);
        // TODO throw error if schema is undefined

        const msg: api.SensorValueMessage = {
            ...schema!,
            value: value,
        };
        
        this._mqtt.publish(`homebot/device/${d.name}/sensor/${sensor}`, JSON.stringify(msg, undefined, 4));
    }
    
    private _handleDiscoveryRequest(topic: string, req: Buffer): void {
        this._manager.getRegisteredDevices().forEach(d => this._publishDevice(d));
    }
}
