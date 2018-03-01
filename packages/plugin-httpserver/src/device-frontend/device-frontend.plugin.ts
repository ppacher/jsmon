import {Plugin} from '@homebot/core';
import {DeviceHttpApi} from './device-frontend';

@Plugin({
    providers: [
        DeviceHttpApi
    ]
})
export class DeviceHttpApiPlugin {

}