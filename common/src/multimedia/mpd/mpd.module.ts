import {Module} from '@homebot/core';
import {MPDClientService} from './mpd.service';

@Module({
    exports: [
        MPDClientService,
    ]
})
export class MPDModule {
    
}