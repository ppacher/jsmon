import {Optional, Inject, OnDestroy, Provider, Type} from '@jsmon/core';
import {Sensor, Command, Device, Logger} from '@jsmon/platform';
import {ParameterType} from '@jsmon/platform/proto';

import {ScanProvider, HostScanner} from './scanner.interface';
import {Observable} from 'rxjs/Observable';
import {interval} from 'rxjs/observable/interval';
import {takeUntil, share} from 'rxjs/operators';
import {Subject} from 'rxjs/Subject';
import {clearInterval, setInterval} from 'timers';

import {isIP} from 'net';
import { Observer } from 'rxjs/Observer';

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
    private _last: boolean|null = null;

    @Sensor({
        name: 'online',
        type: ParameterType.BOOLEAN
    })
    public readonly online: Observable<boolean>;

    constructor(
        @Inject(ScanProvider) private _scanner: HostScanner,
        private _config: WatcherDeviceConfig,
        private _logger: Logger
    ) {
        if (!isIP(this._config.target)) {
            throw new Error(`Invalid target: Expected IP but received ${this._config.target}`);
        }
        
        this._logger.debug(`Setting rescan interval to ${this._config.interval}`);
        
        this.online = new Observable<boolean>(observer => {
            let interval = setInterval(() => this._scan(observer), this._config.interval);

            this._scan(observer);

            return () => {
                this._logger.debug(`Stopping scanning of ${this._config.target}`);
                
                clearInterval(interval);
            };     
            
        }).pipe(takeUntil(this._destroyed),share());
    }

    private async _scan(observer: Observer<boolean>)  {
        
        // Skip this interval if we are already scanning
        if (this._scanning) {
            this._logger.debug(`Scan for ${this._config.target} already running`);
            return;
        }
        
        this._logger.debug(`Starting scan for ${this._config.target}`);
        this._scanning = true;
        
        try {
            const result = await this._scanner.scan(this._config.target);
            const isOnline = result.length === 1;
            
            if (isOnline !== this._last) {
                observer.next(result.length == 1); // the user MUST enter one IP and is not allowed to enter a range
                this._logger.info(`${this._config.target} went ${isOnline ? 'online' : 'offline'}`);
                this._last = isOnline;
            }
        } catch(err) {
            this._logger.error(`Failed to scan for target ${this._config.target}`)
        } finally {
            this._scanning = false;
        }
    }

    onDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    }
}