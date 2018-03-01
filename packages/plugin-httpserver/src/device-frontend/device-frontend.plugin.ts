import {Plugin} from '@homebot/core';
import {DeviceHttpApi} from './device-frontend';

@Plugin({
    providers: [
        DeviceHttpApi
    ],
    bootstrapService: [
        DeviceHttpApi
    ]
})
export class DeviceHttpApiPlugin {

}