import {Plugin} from '@jsmon/core';
import {MqttService} from './mqtt.service';
import {MqttDeviceAPI} from './device.api';

@Plugin({
    providers: [
        MqttService,
        MqttDeviceAPI
    ]
})
export class MqttPlugin {}
