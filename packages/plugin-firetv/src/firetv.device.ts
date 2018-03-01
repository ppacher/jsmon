import {Device, Sensor, Command, Provider, ParameterType} from '@homebot/core';
import {FireTV} from './firetv';
import {FireTVState} from './states';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {interval} from 'rxjs/observable/interval';

import {switchMap, map, distinctUntilChanged, startWith} from 'rxjs/operators';

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

    @Sensor({
        name: 'state',
        type: ParameterType.String
    })
    readonly state = this._state.asObservable();

    constructor(private _config: FireTVConfig) {
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
            )       
            .subscribe(state => this._state.next(state));
    }
}