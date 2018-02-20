import {Module, ModuleWithExports} from '@homebot/core';
import {DeviceManager} from './device-manager.service';

@Module({
    exports: [
        DeviceManager
    ]
})
export class DeviceManagerModule {
}