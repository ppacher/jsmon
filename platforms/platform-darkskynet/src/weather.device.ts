import {Provider, Optional, OnDestroy} from '@jsmon/core';
import {Device, Sensor, ParameterType, Logger} from '@jsmon/platform';
import {DarkSkyWeatherService} from './weather.service';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {tap, flatMap, share, filter, startWith, catchError, map, takeUntil} from 'rxjs/operators';
import {interval} from 'rxjs/observable/interval';
import {of} from 'rxjs/observable/of';
import {WeatherResponse} from './data';

export class DarkSkyWeatherDeviceConfig {
    constructor(
        public updateInterval: number = 30 * 60 * 1000 // Default: 30minutes
    ) {}
    
    static provide(interval?: number): Provider {
        return {
            provide: DarkSkyWeatherDeviceConfig,
            useValue: new DarkSkyWeatherDeviceConfig(interval),
        }
    }
}

function get<T>(o: Observable<WeatherResponse>, fn: (r: WeatherResponse) => T): Observable<T> {
    return o.pipe(map(fn));
}

@Device({
    description: 'Weather conditions powered by DarkSky.net',
})
export class DarkSkyWeatherDevice implements OnDestroy {

    private readonly _destroyed: Subject<void> = new Subject();
    private readonly _updates: Observable<WeatherResponse> = this._setup();
    
    @Sensor({name: 'lastUpdate', type: ParameterType.NUMBER})
    readonly lastUpdate = get(this._updates, r => r.currently.time);
    
    @Sensor({name: 'currentTemperature', type: ParameterType.NUMBER})
    readonly currentTemperature = get(this._updates, r => r.currently.temperature);
    
    @Sensor({name: 'currentSummary', type: ParameterType.STRING})
    readonly currentSummary = get(this._updates, r => r.currently.summary);
    
    @Sensor({name: 'currentIcon', type: ParameterType.STRING})
    readonly currentIcon = get(this._updates, r => r.currently.icon);
    
    @Sensor({name: 'nearestStormDistance', type: ParameterType.NUMBER})
    readonly nearestStormDistance = get(this._updates, r => r.currently.nearestStormDistance);
    
    @Sensor({name: 'humidity', type: ParameterType.NUMBER})
    readonly humidity = get(this._updates, r => r.currently.humidity);

    @Sensor({name: 'pressure', type: ParameterType.NUMBER})
    readonly pressure = get(this._updates, r => r.currently.pressure);
    
    @Sensor({name: 'windSpeed', type: ParameterType.NUMBER})
    readonly windSpeed = get(this._updates, r => r.currently.windSpeed);
    
    @Sensor({name: 'cloudCover', type: ParameterType.NUMBER})
    readonly cloudCover = get(this._updates, r => r.currently.cloudCover);
    
    @Sensor({name: 'visibility', type: ParameterType.NUMBER})
    readonly visibility = get(this._updates, r => r.currently.visibility);
    
    constructor(private _weather: DarkSkyWeatherService,
                private _config: DarkSkyWeatherDeviceConfig,
                @Optional() private _log: Logger) {

        if (!!this._log) {
            this._log.debug(`weather device initialized`);
        }
    }
    
    onDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    }

    private _setup(): Observable<WeatherResponse> {
        const fetch = this._weather.fetch()
                .pipe(
                    catchError(err => {
                        if (!!this._log) {
                            this._log.error(`Failed to fetch weather information: `, err);
                        }
                        return of(new Error(err));
                    }),
                    filter(res => !(res instanceof Error))
                ) as Observable<WeatherResponse>;

        return interval(this._config.updateInterval) // every 30 minutes
            .pipe(
                takeUntil(this._destroyed),
                startWith(-1), // start instant
                tap(() => {
                    if (!!this._log) {
                        this._log.debug(`updating weather information`);
                    }
                }),
                flatMap(() => fetch), // load data and discard/filter errors
                tap(res => {
                    if (!!this._log) {
                        this._log.info(`received weather data for ${res.latitude}, ${res.longitude}`);
                    }
                }),
                share() // share the observable so we only load the data once for all subscriptions
                        // and as long as there is at least one subscriber
            );
    }
}