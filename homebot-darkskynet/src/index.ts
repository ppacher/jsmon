export * from './weather.service';
import {DarkSkyWeatherService} from './weather.service';
import {Plugin} from '@homebot/core';

@Plugin({
    providers: [
        DarkSkyWeatherService
    ]
})
export class DarkSkyNetWeatherPlugin {}