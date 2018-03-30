import {Injectable, DeviceManager, DeviceController, ParameterDefinition, Logger} from '@homebot/core';
import * as api from '@homebot/core/device-manager/api';
import {MqttService} from '../mqtt.service';

import {_throw} from 'rxjs/observable/throw';
import {map, catchError, publishBehavior} from 'rxjs/operators';
import {toPromise} from 'rxjs/operator/toPromise';

@Injectable()
export class MqttDeviceManagerProxy {
    constructor(
        private _mqtt: MqttService,
        private _manager: DeviceManager,
        private _log: Logger
    ) {
        this._mqtt.subscribe('homebot/device/+')
            .subscribe(([topic, payload]) => this._handleDiscovery(topic, payload));
        this.discover(); 
    }
    
    public discover(): void {
        this._log.info(`Initiating device discovery`);
        this._mqtt.publish('homebot/discovery', 'discover');
    }
    
    private _handleDiscovery(t: string, p: Buffer): void {
        let device: api.DeviceMessage = JSON.parse(p.toString());

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
                        
                        let body: {[key: string]: any} = {};

                        if (!!params) {
                            Array.from(params.keys()).forEach(key => {
                                body[key] = params.get(key);
                            });
                        }

                        const payload = JSON.stringify(body);
                        return toPromise.apply(
                            this._mqtt.call(`homebot/device/${d.name}/command/${cmd.name}`, payload, 5*1000)
                                .pipe(
                                    map(b => b.toString()),
                                    map(d => JSON.parse(d)),
                                    catchError((err: any) => {
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
                };
            }),
            d.sensors.map(sensor => {
                return {
                    name: sensor.name,
                    type: sensor.type,
                    description: sensor.description,
                    onChange: this._mqtt.subscribe(`homebot/device/${d.name}/sensor/${sensor.name}`)
                        .pipe(
                            map(([topic, v]: [string, Buffer]) => {
                                const parsed = JSON.parse(v.toString());
                                return  parsed.value;
                            }),
                            publishBehavior(sensor.value)
                        )
                }
            })
        );

        this._manager.registerDeviceController(controller);
    }
}