import {Plugin} from '@homebot/core';
import {DeviceManager} from './device-manager.service';

@Plugin({
    providers: [
        DeviceManager
    ]
})
export class DeviceManagerModule {}