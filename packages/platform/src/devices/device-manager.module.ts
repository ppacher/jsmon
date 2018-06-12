import {Plugin} from '@jsmon/core';
import {DeviceManager} from './device-manager.service';

@Plugin({
    providers: [
        DeviceManager
    ]
})
export class DeviceManagerModule {}