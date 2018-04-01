import {Plugin} from '@homebot/core';
import {MqttDeviceManagerProxy} from './proxy.service';

@Plugin({
    providers: [
        MqttDeviceManagerProxy
    ],
    bootstrapService: [
        MqttDeviceManagerProxy
    ]
})
export class MqttDeviceManagerProxyPlugin {}