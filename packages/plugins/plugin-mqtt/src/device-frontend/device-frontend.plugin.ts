import {Plugin} from '@homebot/core';
import {MqttDeviceManagerAPI} from './device-frontend';

@Plugin({
    providers: [
        MqttDeviceManagerAPI
    ],
    bootstrapService: [
        MqttDeviceManagerAPI
    ]
})
export class MqttDeviceApiPlugin {}