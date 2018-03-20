import {Injectable, DeviceManager, DeviceController, SensorSchema, Logger} from '@homebot/core';
import * as api from '@homebot/core/device-manager/api';
import {MqttService} from '../mqtt.service';

@Injectable()
export class MqttDeviceAPI {
    constructor(
        private _manager: DeviceManager,
        private _mqtt: MqttService,
        private _log: Logger
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
            
        d.commands.forEach(cmd => {
            this._mqtt.handle(`homebot/device/${d.name}/command/${cmd.name}`, (b: Buffer) => {
                let payload = b.toString();
                let body = {};

                if (payload !== '') {
                    body = JSON.parse(payload);
                }
                
                let params: Map<string, any> = new Map();
                Object.keys(body).forEach(key => {
                    params.set(key, body[key]);
                });
                
                this._log.info(`[mqtt] received RPC for ${d.name}.${cmd.name} with ${params.size} parameters`);

                return cmd.handler.apply(d.instance, [params])
                    .then(res => {
                        return new Buffer(JSON.stringify(res));
                    });
            });
        });

        this._publishDevice(d);
    }
    
    private _publishDevice(d: DeviceController):void {
        const msg: api.DeviceMessage = {
            name: d.name,
            description: d.description,
            sensors: d.getSensorSchemas().map(s => {
                return {
                    ...s,
                    value: d.getSensorValue(s.name),   
                };
            }),
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

        this._log.debug(`[mqtt] publishing sensor value for ${sensor}`);
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
