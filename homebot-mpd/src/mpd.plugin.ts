import {Plugin} from '@homebot/core';
import {MPDClientService} from './mpd.service';

@Plugin({
    providers: [
        MPDClientService,
    ]
})
export class MPDPlugin {
    
}