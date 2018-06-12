import {DarkSkyWeatherService, DarkSkyAPIConfig, DarkSkyNetWeatherPlugin} from './index';
import {PlatformFactories, PlatformParameters} from '@homebot/platform';
import {DarkSkyWeatherDevice, DarkSkyWeatherDeviceConfig} from './weather.device';

export * from './weather.device';

export const homebot: PlatformFactories = {
    'Weather': (params: PlatformParameters) => {
        let {
            apiKey,
            defaultLocation,
            defaultUnits,
            defaultLanguage,
            defaultExclude,
            name,
            interval
        } = params;
        
        return {
            plugin: DarkSkyNetWeatherPlugin,
            devices: [{
                class: DarkSkyWeatherDevice,
                name: name || 'weather',
                providers: [
                    DarkSkyWeatherService,
                    DarkSkyAPIConfig.provide(new DarkSkyAPIConfig(apiKey, defaultLocation, defaultUnits, defaultLanguage, defaultExclude)),
                    DarkSkyWeatherDeviceConfig.provide(interval),
                ],
            }]
        };
    }
}