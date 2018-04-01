import {Plugin} from '@homebot/core';
import {MqttService} from './mqtt.service';
import {MqttDeviceAPI} from './device.api';

@Plugin({
    providers: [
        MqttService,
        MqttDeviceAPI
    ]
})
export class MqttPlugin {}
