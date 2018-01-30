import {Module, ModuleWithExports} from '@homebot/core';
import {DeviceManager} from './device-manager.service';

@Module({})
export class DeviceManagerModule {
    /**
     * Applications should use forRoot()
     * in order to avoid polluting the root injector
     */
    static forRoot(): ModuleWithExports {
        return {
            module: DeviceManagerModule,
            exports: [
                DeviceManager
            ]
        };
    }
}