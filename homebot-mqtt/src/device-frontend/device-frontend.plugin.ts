import {Plugin} from '@homebot/core';
import {MqttDeviceAPI} from './device-frontend';

@Plugin({
    providers: [
        MqttDeviceAPI
    ],
    bootstrapService: [
        MqttDeviceAPI
    ]
})
export class MqttDeviceApiPlugin {}