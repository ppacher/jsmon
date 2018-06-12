import {Optional, Inject, OnDestroy, Provider, Type} from '@jsmon/core';
import {Sensor, Command, Device} from '@jsmon/platform';
import {ParameterType} from '@jsmon/platform/proto';

import {ScanProvider, HostScanner} from './scanner.interface';
import {Observable} from 'rxjs/Observable';
import {interval} from 'rxjs/observable/interval';
import {takeUntil, distinctUntilChanged, share} from 'rxjs/operators';
import {Subject} from 'rxjs/Subject';
import { clearInterval } from 'timers';

import {isIP} from 'net';

export enum DeviceStatus {
    Online = 'online',
    Offline = 'offline'
}

export class WatcherDeviceConfig {
    constructor(
        public readonly target: string,
        public readonly interval: number = 10 * 1000 // Default: every 10 seconds
    ) {}
    
    static provide(target: string, scanner: Type<HostScanner>, interval?: number): Provider[] {
        return [
            {
                provide: WatcherDeviceConfig,
                useValue: new WatcherDeviceConfig(target, interval)
            },
            {
                provide: ScanProvider,
                useClass: scanner,
            }
        ];
    }
}

@Device({
    description: 'Watch online status of a single IP/Hostname'
})
export class WatcherDevice implements OnDestroy {
    private _destroyed: Subject<void> = new Subject();
    private _scanning: boolean = false;

    @Sensor({
        name: 'online',
        type: ParameterType.BOOLEAN
    })
    public readonly online: Observable<boolean>;

    constructor(
        @Inject(ScanProvider) private _scanner: HostScanner,
        private _config: WatcherDeviceConfig
    ) {
        if (!isIP(this._config.target)) {
            throw new Error(`Invalid target: Expected IP but received ${this._config.target}`);
        }
        
        this.online = new Observable<boolean>(observer => {
            let interval = setInterval(async () => {
                // Skip this interval if we are already scanning
                if (this._scanning) {
                    return;
                }
                this._scanning = true;
                
                try {
                    let result = await this._scanner.scan(this._config.target);
                    this._scanning = false;
                    
                    observer.next(result.length == 1); // the user MUST enter one IP and is not allowed to enter a range
                } catch(err) {
                    // TODO(ppacher): add logging
                }
                
            }, this._config.interval);

            return () => clearInterval(interval);     
        }).pipe(takeUntil(this._destroyed),share());
    }

    onDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    }
}