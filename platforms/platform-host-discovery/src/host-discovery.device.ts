import {Type, Provider, Inject, Optional, OnDestroy, createIterableDiffer, IterableDiffer} from '@jsmon/core';
import {DeviceManager, Device, Command, Sensor, Logger, DeviceController} from '@jsmon/platform';
import {ParameterType} from '@jsmon/platform/proto';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {interval} from 'rxjs/observable/interval';
import {takeUntil, filter} from 'rxjs/operators';

import {ScanProvider, HostScanner, provideScanner} from './scanner.interface';

/**
 * Configuration for the {@link HostsDiscoveryDevice}
 */
export class HostsDiscoveryConfig {

    /**
     * Create a new config object
     * 
     * @param {string|string[]} target - One ore more IP/Subnet/Hostname definitions
     * @param {number?} interval - The rescan interval in milliseconds
     * @param {boolean?} dynamicDevice - Wether or not devices should be created for discovered hosts
     */
    constructor(
        public readonly target: string|string[],
        public readonly interval: number = 10 * 1000, // Default: 10 seconds
        public readonly dynamicDevice: boolean = false,
    ) {}

    /**
     * Returns dependency injection providers required for the {@link HostsDiscoveryDevice}
     * 
     * @param {HostsDiscoveryConfig} cfg - The configuration to provide via dependency injection
     * @param {Type<HostScanner>} scanner - The scanner class to use
     */
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

/**
 * Injection token for the {@link HostDevice} that provides the device name
 * 
 * @internal
 */
const DeviceName: string = 'DeviceName'

/**
 * A simple device that is automatically created by the {@link HostsDiscoveryDevice}
 * and provides the current online status of a given host/IP
 *
 * @implements {OnDestroy}
 */
@Device({
    description: 'IP address monitoring'
})
export class HostDevice implements OnDestroy {
    @Sensor({
        name: 'online',
        description: 'Wether or not the host is online'
    })
    readonly online: Subject<boolean> = new Subject<boolean>();

    /**
     * @internal
     */
    onDestroy() {
        this.online.complete();
    }

    constructor(@Inject(DeviceName) public readonly target: string) {}
}


/**
 * A device class that periodically scans a list of network targets and
 * reports their availability
 *
 * @implements {OnDestroy}
 */
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
    private _activeDevices: HostDevice[] = [];
    
    constructor(@Optional() @Inject(ScanProvider) private _scanner: HostScanner,
                private _config: HostsDiscoveryConfig,
                private _deviceManager: DeviceManager,
                @Optional() private _log: Logger) {
                
        if (this._scanner === undefined) {
            throw new Error(`No scan provider defined! Did you forget to use provideScanner(...)`);
        }
        
        if ((Array.isArray(_config.target) && _config.target.length === 0) || (!Array.isArray(_config.target) && _config.target === '')) {
            throw new Error(`No scan targets defined`);
        }
        
        this._target = Array.isArray(_config.target) ? _config.target : [_config.target];
        
        this._differ = createIterableDiffer();
        this._differ.diff([]);
        
        if (this._config.dynamicDevice) {
            this._log.info(`Enabling dynamic device mode`);
        }
        
        interval(_config.interval)
            .pipe(
                filter(() => !this._scanActive),
                takeUntil(this._destroyed),
            )
            .subscribe(() => {
                this._startScan();
            });
    }
    
    /**
     * @internal
     */
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
                        this._info(`${deletedIPs.length} devices went offline`, {devices: deletedIPs.join(', ')});
                        this.lostHosts.next(deletedIPs);
                        
                        this._updateOfflineDevices(deletedIPs);
                    }
                    
                    
                    if (newIPs.length > 0) {
                        this._info(`${newIPs.length} devices went online`, {devices: newIPs.join(', ')});
                        this.newHosts.next(newIPs);
                        
                        this._updateOnlineDevices(newIPs);
                    }
                }
                
                this._debug(`Found ${result.length} active hosts`, result);

                this._lastHosts = result;
                
                this._scanActive = false;
            })
            .catch(err => {
                this._error('Failed to scan network: ' + err.toString());
                this._scanActive = false;
            });
    }
    
    private _updateOfflineDevices(ips: string[]) {
        if (!this._config.dynamicDevice) {
            return;
        }
        
        ips.forEach(ip => {
            let dev = this._activeDevices.find(dev => dev.target === ip);
            
            if (!!dev) {
                dev.online.next(false);
            }
        })
    }
    
    private _updateOnlineDevices(ips: string[]) {
        if (!this._config.dynamicDevice) {
            return;
        }
        
        ips.forEach(ip => {
            let dev = this._activeDevices.find(dev => dev.target === ip);

            if (!!dev) {
                dev.online.next(true);
            } else {
                this._log.info(`Creating new device for ${ip}`);
                
                let controller = this._deviceManager.setupDevice(ip, HostDevice, undefined, [
                    {
                        provide: DeviceName,
                        useValue: ip,
                    }
                ]);
                
                this._activeDevices.push(controller.instance);
                controller.instance.online.next(true);
            }
        })
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
