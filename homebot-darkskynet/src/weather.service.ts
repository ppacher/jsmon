import {Injectable, Provider, Optional} from '@homebot/core';
import {bindNodeCallback} from 'rxjs/observable/bindNodeCallback';
import {Observable} from 'rxjs/Observable';
import {get, Response} from 'request';

import {WeatherResponse} from './data';

import {map, tap} from 'rxjs/operators';

export interface Location {
    latitude: number;
    longitude: number;
}

export type FieldSet = 'currently' | 'minutely' | 'daily' | 'hourly';

export type Units = 'auto' | 'us' | 'si';

export type Language = string;

export class DarkSkyAPIConfig {
    constructor(
        public readonly apiKey: string, 
        public readonly defaultLocation: Location,
        public readonly defaultUnits: Units = 'auto',
        public readonly defaultLanguage: Language = 'de',
        public readonly defaultExclude: FieldSet[] = [],
    ) {}
    
    static provide(cfg: DarkSkyAPIConfig): Provider {
        return {
            provide: DarkSkyAPIConfig,
            useValue: cfg,
        };
    }
}

function getMissingConfigError(): Error {
    return new Error(`No configuration for DarkSky API configued. Please use DarkSkyAPIConfig.provide() in your providers array`);
}

export interface FetchConfig {
    exclude?: FieldSet[];
    unit?: Units;
    language?: Language;
    location?: Location;
}

@Injectable()
export class DarkSkyWeatherService {
    // We mark the config as optional so we can provide a more detailed
    // error message to the user
    constructor(@Optional() public readonly config: DarkSkyAPIConfig) {
        if (this.config === undefined) {
            throw getMissingConfigError();
        }
    }
    
    fetch({exclude, unit, language, location}: FetchConfig = {}): Observable<WeatherResponse> {
        exclude = exclude || this.config.defaultExclude;
        unit = unit || this.config.defaultUnits;
        language = language || this.config.defaultLanguage;
        location = location || this.config.defaultLocation;

        let url = `https://api.darksky.net/forecast/${this.config.apiKey}/${location.latitude},${location.longitude}?lang=${language}&units=${unit}`;
        if (exclude.length > 0) {
            url += '&exclude=' + exclude.join(',');
        }

        const fetch = bindNodeCallback((uri: string, cb: (err: any, res: WeatherResponse) => void) => {
            get(uri, (err, res) => {
                const parsed = JSON.parse(res.body);
                return cb(err, parsed);
            });
        });

        return fetch(url);
    }
    
}