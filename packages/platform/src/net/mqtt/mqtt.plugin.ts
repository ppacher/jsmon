import {Plugin} from '@jsmon/core';
import {MqttService} from './mqtt.service';

@Plugin({
    providers: [
        MqttService,
    ]
})
export class MqttPlugin {}
