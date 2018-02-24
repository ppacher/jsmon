import {Injectable, Provider, Optional} from '@homebot/core';
import {bindNodeCallback} from 'rxjs/observable/bindNodeCallback';
import {Observable} from 'rxjs/Observable';
import {readFile} from 'fs';
import {resolve} from 'path';

import {WeatherResponse} from './data';

import {map} from 'rxjs/operators';

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

        const load = bindNodeCallback(readFile);

        return load(resolve(__dirname, './mock.json'))
            .pipe(map((b:Buffer) => JSON.parse(b.toString())));
    }
}