import {Device, Sensor, ParameterType} from '@homebot/core';
import {DarkSkyWeatherService} from './weather.service';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {flatMap, share, filter, startWith, catchError, map} from 'rxjs/operators';
import {interval} from 'rxjs/observable/interval';
import {of} from 'rxjs/observable/of';
import { WeatherResponse } from './data';

function get<T>(o: Observable<WeatherResponse>, fn: (r: WeatherResponse) => T): Observable<T> {
    return o.pipe(map(fn));
}

@Device({
    description: 'Weather conditions',
})
export class DarkSkyWeatherDevice {

    private readonly _updates: Observable<WeatherResponse> = this._setup();
    
    @Sensor({name: 'lastUpdate', type: ParameterType.Number})
    readonly lastUpdate = get(this._updates, r => r.currently.time);
    
    @Sensor({name: 'currentTemperature', type: ParameterType.Number})
    readonly currentTemperature = get(this._updates, r => r.currently.temperature);
    
    constructor(private _weather: DarkSkyWeatherService) {}

    private _setup(): Observable<WeatherResponse> {
        const fetch = this._weather.fetch()
                .pipe(
                    catchError(err => of(new Error(err))),
                    filter(res => !(res instanceof Error))
                ) as Observable<WeatherResponse>;

        return interval(30 * 60 * 1000) // every 30 minutes
            .pipe(
                startWith(-1), // start instant
                flatMap(() => fetch), // load data and discard/filter errors
                share() // share the observable so we only load the data once
            );
    }
}