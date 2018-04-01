export * from './weather.service';
export * from './data';
export * from './weather.device';

import {DarkSkyWeatherService, DarkSkyAPIConfig} from './weather.service';
import {Plugin} from '@homebot/core';
import {SkillFactories, SkillParameters, Skill, SkillType} from '@homebot/platform';
import {DarkSkyWeatherDevice} from './weather.device';

@Plugin({
    providers: [
        DarkSkyWeatherService
    ]
})
export class DarkSkyNetWeatherPlugin {}

export const skills: SkillFactories = {
    'Weather': {
        create(params: SkillParameters): Skill<typeof DarkSkyWeatherDevice> {
            let {
                apiKey,
                defaultLocation,
                defaultUnits,
                defaultLanguage,
                defaultExclude,
            } = params;
            
            return {
                token: DarkSkyWeatherDevice,
                providers: [
                    DarkSkyWeatherService,
                    DarkSkyAPIConfig.provide(new DarkSkyAPIConfig(apiKey, defaultLocation, defaultUnits, defaultLanguage, defaultExclude))
                ],
                type: SkillType.Device
            };
        }
    }
}