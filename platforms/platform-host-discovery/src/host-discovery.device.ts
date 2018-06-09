import {Type, Provider, Inject, Optional, OnDestroy, createIterableDiffer, IterableDiffer} from '@homebot/core';
import {Device, Command, Sensor, Logger} from '@homebot/platform';
import {ParameterType} from '@homebot/platform/proto';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {interval} from 'rxjs/observable/interval';
import {takeUntil, filter} from 'rxjs/operators';

import {ScanProvider, HostScanner, provideScanner} from './scanner.interface';

export class HostsDiscoveryConfig {
    constructor(
        public readonly target: string|string[]
    ) {}

    static provide(cfg: HostsDiscoveryConfig, scanner: Type<HostScanner>): Provider[] {
        return [
            provideScanner(scanner),
            {
                provide: HostsDiscoveryConfig,
                useValue: cfg,
            }
        ]
    }
}

@Device({
    description: 'Monitor IPs in a network'
})
export class HostsDiscoveryDevice implements OnDestroy {
    @Sensor({
        name: 'hosts',
        type: ParameterType.STRING_ARRAY,
        description: 'IP addresses available within the network'
    })
    readonly ips: Subject<string[]> = new Subject<string[]>();
    
    @Sensor({
        name: 'new_hosts',
        type: ParameterType.STRING_ARRAY,
        description: 'Emits a list of new IP addresses discovered'
    })
    readonly newHosts: Subject<string[]> = new Subject<string[]>();
    
    @Sensor({
        name: 'deleted_hosts',
        type: ParameterType.STRING_ARRAY,
        description: 'Emits a list of IP addresses that went away'
    })
    readonly lostHosts: Subject<string[]> = new Subject<string[]>();
    
    private readonly _destroyed: Subject<void> = new Subject<void>();
    private _scanActive: boolean = false;
    private _lastHosts: string[] = [];
    private _differ: IterableDiffer<string>;
    private _target: string[] = [];
    
    constructor(@Optional() @Inject(ScanProvider) private _scanner: HostScanner,
                config: HostsDiscoveryConfig,
                @Optional() private _log: Logger) {
                
        if (this._scanner === undefined) {
            throw new Error(`No scan provider defined! Did you forget to use provideScanner(...)`);
        }
        
        if ((Array.isArray(config.target) && config.target.length === 0) || (!Array.isArray(config.target) && config.target === '')) {
            throw new Error(`No scan targets defined`);
        }
        
        this._target = Array.isArray(config.target) ? config.target : [config.target];
        
        this._differ = createIterableDiffer();
        this._differ.diff([]);
        
        interval(1000)
            .pipe(
                filter(() => !this._scanActive),
                takeUntil(this._destroyed),
            )
            .subscribe(() => {
                this._startScan();
            });
    }
    
    onDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
        
        if (!this._scanActive) {
            this.ips.complete();
            this.lostHosts.complete();
            this.newHosts.complete();
        } else {
            this.ips.subscribe(() => {
                this.ips.complete();
                this.lostHosts.complete();
                this.newHosts.complete();
            });
        }
    }
    
    private _startScan() {
        this._scanActive = true;

        this._scanner.scan(this._target.join(' '))
            .then(result => {
                this.ips.next(result);                
                
                let diff = this._differ.diff(result);

                if (diff !== null) {
                    let deletedIPs: string[] = [];
                    let newIPs: string[] = [];

                    diff.forEachDeletedIdentity(record => deletedIPs.push(record.item));
                    diff.forEachNewIdentity(record => newIPs.push(record.item));
                    
                    if (deletedIPs.length > 0) {
                        this._debug(`${deletedIPs.length} devices went offline`, {devices: deletedIPs.join(', ')});
                        this.lostHosts.next(deletedIPs);
                    }
                    
                    
                    if (newIPs.length > 0) {
                        this._debug(`${newIPs.length} devices went online`, {devices: newIPs.join(', ')});
                        this.newHosts.next(newIPs);
                    }
                }
                
                this._info(`Found ${result.length} active hosts`);

                this._lastHosts = result;
                
                this._scanActive = false;
            })
            .catch(err => {
                this._error('Failed to scan network: ', err)
                this._scanActive = false;
            });
    }

    private _debug(msg: string, ...args: any[]): void {
        if (!!this._log) {
            this._log.debug(msg, ...args);
        }
    }
    
    private _info(msg: string, ...args: any[]): void {
        if (!!this._log) {
            this._log.info(msg, ...args);
        }
    }
    
    private _error(msg: string, ...args: any[]): void {
        if (!!this._log) {
            this._log.error(msg, ...args);
        }
    }
}
