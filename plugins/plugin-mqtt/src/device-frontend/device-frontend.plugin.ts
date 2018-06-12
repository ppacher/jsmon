import {Plugin} from '@jsmon/core';
import {MqttDeviceManagerAPI} from './device-frontend';

@Plugin({
    providers: [
        MqttDeviceManagerAPI
    ]
})
export class MqttDeviceApiPlugin {
    constructor(_: MqttDeviceManagerAPI) {}
}
