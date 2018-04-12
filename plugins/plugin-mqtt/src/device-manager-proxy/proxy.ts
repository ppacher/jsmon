import {Plugin} from '@homebot/core';
import {MqttDeviceManagerProxy} from './proxy.service';

@Plugin({
    providers: [
        MqttDeviceManagerProxy
    ],
})
export class MqttDeviceManagerProxyPlugin {
    constructor(_: MqttDeviceManagerProxy) {}
}
