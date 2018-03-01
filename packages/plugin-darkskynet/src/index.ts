export * from './weather.service';
export * from './data';
export * from './weather.device';

import {DarkSkyWeatherService} from './weather.service';
import {Plugin} from '@homebot/core';

@Plugin({
    providers: [
        DarkSkyWeatherService
    ]
})
export class DarkSkyNetWeatherPlugin {}