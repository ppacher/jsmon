import {Plugin} from '../plugin';
import {DeviceManager} from './device-manager.service';

@Plugin({
    providers: [
        DeviceManager
    ]
})
export class DeviceManagerModule {
}