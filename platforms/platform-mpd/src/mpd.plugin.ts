import {Plugin} from '@jsmon/core';
import {MPDClientService} from './mpd.service';

@Plugin({
    providers: [
        MPDClientService,
    ]
})
export class MPDPlugin {
    
}