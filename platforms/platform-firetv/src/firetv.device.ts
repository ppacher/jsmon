import {Provider} from '@homebot/core';
import {Device, Sensor, Command, ParameterType, Logger} from '@homebot/platform';
import {FireTV} from './firetv';
import {FireTVState} from './states';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {interval} from 'rxjs/observable/interval';
import {of} from 'rxjs/observable/of';

import {switchMap, map, distinctUntilChanged, startWith, catchError} from 'rxjs/operators';

export class FireTVConfig {
    constructor(
        public readonly host: string
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
export class FireTVDevice {
    private _device: FireTV;
    private _state: BehaviorSubject<FireTVState> = new BehaviorSubject(FireTVState.DISCONNECTED);
    private _app: BehaviorSubject<string|null> = new BehaviorSubject<string|null>(null);
    private _runningApps: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

    @Sensor({
        name: 'state',
        type: ParameterType.STRING
    })
    readonly state = this._state.asObservable();

    @Sensor({
        name: 'app',
        type: ParameterType.STRING
    })
    readonly currentApp = this._app.asObservable();
    
    @Sensor({
        name: 'running_apps',
        type: ParameterType.STRING
    })
    readonly runningApps = this._runningApps.asObservable();
    
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
        // TODO: unregistrations

        // setup the _state poller
        interval(5000) 
            .pipe(
                startWith(-1),
                switchMap(() => this._device.getPowerState()),
                catchError(err => {
                    this._log.error(err);
                    return of(FireTVState.DISCONNECTED);
                }),
            )       
            .subscribe(state => this._state.next(state));
        
        interval(5000) 
            .pipe(
                startWith(-1),
                switchMap(() => this._device.currentApp()),
            )       
            .subscribe(app => this._app.next(app));
        
        interval(5000) 
            .pipe(
                startWith(-1),
                switchMap(() => this._device.getRunningApps()),
            )       
            .subscribe(apps => this._runningApps.next(apps || []));
    }
}