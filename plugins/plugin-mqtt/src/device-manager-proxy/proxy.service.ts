import {Injectable, Injector, createIterableDiffer, TrackByFunction} from '@homebot/core';
import {DeviceManager, DeviceController, ParameterDefinition, Logger, Command, ParameterType, SensorSchema} from '@homebot/platform';
import * as api from '@homebot/platform/devices/api';
import {MqttDeviceAPI} from '../device.api';

import {_throw} from 'rxjs/observable/throw';
import {map, catchError, publishBehavior} from 'rxjs/operators';
import {toPromise} from 'rxjs/operator/toPromise';

@Injectable()
export class MqttDeviceManagerProxy {
    private _log: Logger;

    constructor(
        private _api: MqttDeviceAPI,
        private _manager: DeviceManager,
        private _injector: Injector,
        log: Logger
    ) {
        this._log = log.createChild('mqtt:device-proxy')
        
        this._api.watchDeviceAnnouncements()
            .subscribe(device => this._handleDiscovery(device));
            
        this._api.initiateDiscovery();
    }
    
    public discover(): void {
        this._api.initiateDiscovery();
    }
    
    private _handleDiscovery(device: api.DeviceMessage): void {
        const registeredDevices = this._manager.getRegisteredDevices();
        const controller = registeredDevices.find(ctrl => ctrl.name === device.name);
        
        if (!!controller) {
            if (this._hasDeviceChanged(controller, device)) {
                this._log.info(`Recreating device controller for ${device.name}`);
                this._manager.unregisterDeviceController(controller);
                controller.dispose();
                
            } else {
                this._log.debug(`Device ${device.name} already registered`);
                return;
            }
        } else {
            this._log.info(`Registering new device ${device.name}`);
        }

        this._registerDevice(device);
    }
    
    private _registerDevice(d: api.DeviceMessage): void {
        const injector = this._createDeviceInjector();

        const controller = new DeviceController(
            d.name,
            null,
            d.commands.map(cmd => {
                return {
                    name: cmd.name,
                    description: cmd.description,
                    parameters: cmd.parameters as any,
                    handler: (params: Map<string, any>) => {
                        this._log.info(`sending RPC for ${d.name}.${cmd.name} with ${params.size} parameters`);
                        
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
            }),
            injector
        );

        this._manager.registerDeviceController(controller);
    }
    
    private _createDeviceInjector() {
        return this._injector.createChild([]);
    }
    
    private _hasDeviceChanged(old: DeviceController, current: api.DeviceMessage): boolean {
        const trackCommands: TrackByFunction<Command> = (idx: number, cmd: Command) => {
            return `${cmd.name}:${cmd.description}`;
        }
        
        const trackParameter: TrackByFunction<ParameterDefinition|ParameterType[]> = (idx: number, param: ParameterDefinition|ParameterType[]) => {
            if (Array.isArray(param)) {
                let types = [...param].sort((a, b) => a.localeCompare(b))
                return `${types.join(',')}`;
            }
            
            let types = [...param.types].sort((a, b) => a.localeCompare(b))
            return `${param.help}:${param.optional}:${types.join(',')}`;
        }

        const trackSenors: TrackByFunction<SensorSchema> = (idx: number, sensor: SensorSchema) => {
            return `${sensor.name}:${sensor.description}:${sensor.type}`;
        }

        let commandDiffer = createIterableDiffer(trackCommands);
        commandDiffer.diff(old.commands);
        let diff = commandDiffer.diff(current.commands);
        if (diff !== null && (diff.countDeletedIdentities() > 0 || diff.countNewIdentities() > 0)) {
            this._log.info(`${current.name}: ${diff.countDeletedIdentities()} deleted and ${diff.countNewIdentities()} new commands `);
            return true;
        }
        
        let hasParamsChanged = current.commands.some(cmd => {
            let oldCommand = old.commands.find(c => c.name === cmd.name);
            
            let nameDiffer = createIterableDiffer();
            nameDiffer.diff(Object.keys(oldCommand.parameters || {}));
            if (nameDiffer.diff(Object.keys(cmd.parameters || {})) !== null) {
                this._log.info(`${current.name} parameters have changed`);
                return true;
            }
            
            let paramDiffer = createIterableDiffer(trackParameter);
            paramDiffer.diff(Object.keys(oldCommand.parameters || {}).map(key => oldCommand.parameters[key]));
            let diff = paramDiffer.diff(Object.keys(cmd.parameters || {}).map(key => cmd.parameters[key]));

            if (diff !== null && (diff.countDeletedIdentities() > 0 || diff.countNewIdentities() > 0)) {
                this._log.info(`${current.name} parameters have changed`);
                return true;
            }
            
            return false;
        });
        
        if (hasParamsChanged) {
            return true;
        }
        
        let sensorDiffer = createIterableDiffer(trackSenors);
        sensorDiffer.diff(old.getSensorSchemas());
        let sensorDiff = sensorDiffer.diff(current.sensors);
        
        if (sensorDiff !== null && (sensorDiff.countDeletedIdentities() > 0 || sensorDiff.countNewIdentities() > 0)) {
            this._log.info(`${current.name} ${sensorDiff.countDeletedIdentities()} deleted and ${sensorDiff.countNewIdentities()} new sensors`);
            return true;
        }

        return false;
    }
}