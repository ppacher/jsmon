import {Plugin} from '@homebot/core';
import {MqttService} from './mqtt.service';

@Plugin({
    providers: [
        MqttService
    ]
})
export class MqttPlugin {}
