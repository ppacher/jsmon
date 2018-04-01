import {Device, Sensor, ParameterType} from '@homebot/platform';
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
    description: 'Weather conditions powered by DarkSky.net',
})
export class DarkSkyWeatherDevice {

    private readonly _updates: Observable<WeatherResponse> = this._setup();
    
    @Sensor({name: 'lastUpdate', type: ParameterType.Number})
    readonly lastUpdate = get(this._updates, r => r.currently.time);
    
    @Sensor({name: 'currentTemperature', type: ParameterType.Number})
    readonly currentTemperature = get(this._updates, r => r.currently.temperature);
    
    @Sensor({name: 'currentSummary', type: ParameterType.String})
    readonly currentSummary = get(this._updates, r => r.currently.summary);
    
    @Sensor({name: 'currentIcon', type: ParameterType.String})
    readonly currentIcon = get(this._updates, r => r.currently.icon);
    
    @Sensor({name: 'nearestStormDistance', type: ParameterType.Number})
    readonly nearestStormDistance = get(this._updates, r => r.currently.nearestStormDistance);
    
    @Sensor({name: 'humidity', type: ParameterType.Number})
    readonly humidity = get(this._updates, r => r.currently.humidity);

    @Sensor({name: 'pressure', type: ParameterType.Number})
    readonly pressure = get(this._updates, r => r.currently.pressure);
    
    @Sensor({name: 'windSpeed', type: ParameterType.Number})
    readonly windSpeed = get(this._updates, r => r.currently.windSpeed);
    
    @Sensor({name: 'cloudCover', type: ParameterType.Number})
    readonly cloudCover = get(this._updates, r => r.currently.cloudCover);
    
    @Sensor({name: 'visibility', type: ParameterType.Number})
    readonly visibility = get(this._updates, r => r.currently.visibility);
    
    constructor(private _weather: DarkSkyWeatherService) {}

    private _setup(): Observable<WeatherResponse> {
        const fetch = this._weather.fetch()
                .pipe(
                    catchError(err => of(new Error(err))),
                    // TODO: add logging for errors
                    filter(res => !(res instanceof Error))
                ) as Observable<WeatherResponse>;

        return interval(30 * 60 * 1000) // every 30 minutes
            .pipe(
                startWith(-1), // start instant
                flatMap(() => fetch), // load data and discard/filter errors
                share() // share the observable so we only load the data once for all subscriptions
                        // and as long as there is at least one subscriber
            );
    }
}