import {Injectable, Injector, createIterableDiffer, TrackByFunction} from '@jsmon/core';
import {DeviceManager, DeviceController, IParameterDefinition, Logger, Command, ParameterType, ISensorSchema} from '@jsmon/platform';
import {IDeviceDiscoveryAnnouncement, ICommandDefinition} from '@jsmon/platform/proto';
import {MqttDeviceAPI} from '../device.api';

import {_throw} from 'rxjs/observable/throw';
import {map, catchError, shareReplay, startWith} from 'rxjs/operators';
import {toPromise} from 'rxjs/operator/toPromise';
import { IDeviceDefinition, DeviceDefinition, ISensorValue } from '@jsmon/platform/proto';

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
    
    private _handleDiscovery(announcement: IDeviceDiscoveryAnnouncement): void {
        const device = announcement.device;
        
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

        this._registerDevice(device, announcement.sensorValues);
    }
    
    private _registerDevice(d: IDeviceDefinition, sensorValues: ISensorValue[]): void {
        const injector = this._createDeviceInjector();

        const controller = new DeviceController(
            d.name,
            null,
            d.commands.map(cmd => {
                return {
                    name: cmd.name,
                    shortDescription: cmd.shortDescription,
                    longDescription: cmd.longDescription,
                    parameters: cmd.parameters as any,
                    handler: (params: Map<string, any>) => {
                        this._log.info(`sending RPC for ${d.name}.${cmd.name} with ${params.size} parameters`);
                        
                        return this._api.call(d.name, cmd.name, params);
                    }
                };
            }),
            d.sensors.map(sensor => {
                let value: ISensorValue = sensorValues.find(v => v.deviceName === d.name && v.sensorName === sensor.name);
                return {
                    name: sensor.name,
                    type: sensor.type,
                    unit: sensor.unit,
                    customUnit: sensor.customUnit,
                    description: sensor.description,
                    onChange: this._api.watchSensor(d.name, sensor.name)
                        .pipe(
                            startWith(value.value ? JSON.parse(value.value) : null),
                            shareReplay(1)
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
    
    private _hasDeviceChanged(old: DeviceController, current: IDeviceDefinition): boolean {
        const trackCommands: TrackByFunction<ICommandDefinition> = (idx: number, cmd: ICommandDefinition) => {
            return `${cmd.name}:${cmd.shortDescription}`;
        }
        
        const trackParameter: TrackByFunction<IParameterDefinition|ParameterType[]> = (idx: number, param: IParameterDefinition|ParameterType[]) => {
            if (Array.isArray(param)) {
                let types = [...param].sort((a, b) => a - b)
                return `${types.join(',')}`;
            }
            
            let types = [...param.types].sort((a, b) => a - b)
            return `${param.description}:${param.optional}:${types.join(',')}`;
        }

        const trackSenors: TrackByFunction<ISensorSchema> = (idx: number, sensor: ISensorSchema) => {
            return `${sensor.name}:${sensor.description}:${sensor.type}`;
        }

        let commandDiffer = createIterableDiffer(trackCommands);
        commandDiffer.diff(old.getCommandDefinitions());
        let diff = commandDiffer.diff(current.commands);
        if (diff !== null && (diff.countDeletedIdentities() > 0 || diff.countNewIdentities() > 0)) {
            this._log.info(`${current.name}: ${diff.countDeletedIdentities()} deleted and ${diff.countNewIdentities()} new commands `);
            return true;
        }
        
        let hasParamsChanged = current.commands.some(cmd => {
            let oldCommand = old.getCommandDefinitions().find(c => c.name === cmd.name);
            
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