import {Provider, OnDestroy} from '@homebot/core';
import {Device, Sensor, Command, ParameterType, Logger} from '@homebot/platform';
import {FireTV} from './firetv';
import {FireTVState} from './states';

import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {interval} from 'rxjs/observable/interval';
import {of} from 'rxjs/observable/of';

import {switchMap, map, distinctUntilChanged, startWith, catchError, takeUntil} from 'rxjs/operators';

export class FireTVConfig {
    constructor(
        public readonly host: string,
        public readonly interval: number = 5 * 1000 // Default: 5 seconds
    ) {}

    static provide(cfg: FireTVConfig): Provider {
        return {
            provide: FireTVConfig,
            useValue: cfg
        };
    }
}

@Device({
    description: 'FireTV device'
})
export class FireTVDevice implements OnDestroy {
    private _device: FireTV;
    private _state: BehaviorSubject<FireTVState> = new BehaviorSubject(FireTVState.DISCONNECTED);
    private _app: BehaviorSubject<string|null> = new BehaviorSubject<string|null>(null);
    private _runningApps: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
    private readonly _destroyed: Subject<void> = new Subject();

    @Sensor({
        name: 'state',
        type: ParameterType.STRING
    })
    readonly state = this._state.asObservable().pipe(takeUntil(this._destroyed));

    @Sensor({
        name: 'app',
        type: ParameterType.STRING
    })
    readonly currentApp = this._app.asObservable().pipe(takeUntil(this._destroyed));
    
    @Sensor({
        name: 'running_apps',
        type: ParameterType.STRING
    })
    readonly runningApps = this._runningApps.asObservable().pipe(takeUntil(this._destroyed));
    
    @Command({
        name: 'powerOn',
        description: 'Power on the FireTV'
    })
    powerOn(): Promise<string> {
        return new Promise((resolve, reject) => {
            this._device.turnOn()
                .subscribe(() => resolve(`Successfully turned on`), err => reject(err));
        });
    }
    
    @Command({
        name: 'powerOff',
        description: 'Power off the FireTV'
    })
    powerOff(): Promise<string>{
        return new Promise((resolve, reject) => {
            this._device.turnOff()
                .subscribe(() => resolve('Successfully turned off'), err => reject(err));
        });
    }

    constructor(private _config: FireTVConfig, private _log: Logger) {
        this._device = new FireTV(this._config.host);

        // TODO: we need to wait for the device to be connected
        // until we can do the setup
        // fix FireTV class to be more error specific
        this._device.ready.subscribe(() => this._setup());
    }
    
    private _setup(): void {
        let update$ = interval(this._config.interval)
            .pipe(takeUntil(this._destroyed))

        update$ 
            .pipe(
                startWith(-1),
                switchMap(() => this._device.getPowerState()),
                catchError(err => {
                    this._log.error(err);
                    return of(FireTVState.DISCONNECTED);
                }),
            )       
            .subscribe(state => this._state.next(state));
        
        update$ 
            .pipe(
                startWith(-1),
                switchMap(() => this._device.currentApp()),
            )       
            .subscribe(app => this._app.next(app));
        
        update$ 
            .pipe(
                startWith(-1),
                switchMap(() => this._device.getRunningApps()),
            )       
            .subscribe(apps => this._runningApps.next(apps || []));
    }
    
    onDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
        
        this._device.onDestroy();
    }
}