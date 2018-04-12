import {Plugin} from '@homebot/core';
import {MqttDeviceManagerAPI} from './device-frontend';

@Plugin({
    providers: [
        MqttDeviceManagerAPI
    ]
})
export class MqttDeviceApiPlugin {
    constructor(_: MqttDeviceManagerAPI) {}
}
