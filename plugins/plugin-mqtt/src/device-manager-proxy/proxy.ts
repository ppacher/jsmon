import {Plugin} from '@jsmon/core';
import {MqttDeviceManagerProxy} from './proxy.service';

@Plugin({
    providers: [
        MqttDeviceManagerProxy
    ],
})
export class MqttDeviceManagerProxyPlugin {
    constructor(_: MqttDeviceManagerProxy) {}
}
