import {Plugin} from '@jsmon/core';
import {DeviceHttpApi} from './device-frontend';

@Plugin({
    providers: [
        DeviceHttpApi
    ],
})
export class DeviceHttpApiPlugin {
    constructor(_: DeviceHttpApi) {}
}
