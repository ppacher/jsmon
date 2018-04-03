import {DarkSkyWeatherService, DarkSkyAPIConfig, DarkSkyNetWeatherPlugin} from './index';
import {PlatformFactories, PlatformParameters} from '@homebot/platform';
import {DarkSkyWeatherDevice} from './weather.device';

export * from './weather.device';

export const homebot: PlatformFactories = {
    'Weather': (params: PlatformParameters) => {
        let {
            apiKey,
            defaultLocation,
            defaultUnits,
            defaultLanguage,
            defaultExclude,
            name
        } = params;
        
        return {
            plugin: DarkSkyNetWeatherPlugin,
            devices: [{
                class: DarkSkyWeatherDevice,
                name: name || 'weather',
                providers: [
                    DarkSkyWeatherService,
                    DarkSkyAPIConfig.provide(new DarkSkyAPIConfig(apiKey, defaultLocation, defaultUnits, defaultLanguage, defaultExclude))
                ],
            }]
        };
    }
}