import {Injectable, Inject, Optional, OnDestroy} from '@jsmon/core';
import {StorageAdapter} from './storage.adapter';
import {TimeSeriesStorage, QueryOptions, Value, ValueIterator} from './storage.interface';
import {DeviceManager, DeviceController} from '../devices';

import {Subject} from 'rxjs/Subject';
import {takeUntil} from 'rxjs/operators';

@Injectable()
export class SensorStorageManager implements OnDestroy {
    private readonly _destroyed = new Subject<void>();

    constructor(@Optional() @Inject(StorageAdapter) private _adapter: TimeSeriesStorage,
                private _manager: DeviceManager) {
                
        // We use @Optional() to provide a better error message than the one produced
        // by the dependecy injector
        if (!this._adapter) {
            throw new Error(`No StorageAdapter provided. Did you forgot to use provideStorageAdapter(...)?`)
        }
        
        this._initialize();
    }
                
    onDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    } 
    
    private _initialize() {
        this._manager.registrations
            .pipe(takeUntil(this._destroyed))
            .subscribe(device => this._handleRegistration(device));
    }
    
    private _handleRegistration(device: DeviceController): void {
        // only used to stop watching sensor values, we DO NOT remove the device sensor
        // on unregistration
        let unregistered = this._manager.onDeviceUnregistration([device.name]);
        
        device.getSensorSchemas()
            .forEach(async (schema) => {
            
                let hasSensor = await this._adapter.hasDeviceSensor(device.name, schema)
                                        .catch(err => false);
                                        
                if (!hasSensor) {
                    // either the sensor does not exist at all or the
                    // schema has changed

                    try {
                        await this._adapter.dropDeviceSensor(device.name, schema.name!);
                    } catch (err) {}
                }
                
                try {
                    await this._adapter.addDeviceSensor(device.name, schema);
                } catch(err) {
                    // TODO(ppacher): add logging
                    return;
                }
                
                device.watchSensor(schema.name!)
                    .pipe(takeUntil(unregistered))
                    .subscribe(async (value) => {
                        try {
                            await this._adapter.writeValue(device.name, schema.name!, value);
                        } catch(err) {
                            // TODO(ppacher): add logging
                        }
                    });
            });
    }
}