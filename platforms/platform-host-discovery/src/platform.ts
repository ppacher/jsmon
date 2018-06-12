import {PlatformParameters, PlatformFactories, PlatformSpec} from '@jsmon/platform';
import { HostDiscoveryPlugin, WatcherDeviceConfig } from './index';
import {HostsDiscoveryConfig, HostsDiscoveryDevice} from './host-discovery.device';
import {NmapScanner} from './scanners';
import {WatcherDevice} from './watcher.device';

export const jsmon: PlatformFactories = {
    'HostsDiscovery': (params: PlatformParameters) => {
        if (!params['target']) {
            throw new Error(`Missing targets for HostDiscovery`);
        }
        
        const name = params.name;
        const targets = params['target'];
        let interval = params.interval;
        
        if (!Array.isArray(targets) && typeof targets !== 'string') {
            throw new Error(`Invalid target configuration for HostsDiscovery device "${name}"`)   ;
        }
        
        if (!!interval && typeof interval === 'string') {
            try {
                interval = parseInt(interval);
            } catch (err) {
                throw new Error(`Invalid interval specified for HostsDiscovery device ${name}`);
            }
        }
        
        return {
            plugin: HostDiscoveryPlugin,
            devices: [
                {
                    class: HostsDiscoveryDevice,
                    name: name,
                    providers: [
                        ...HostsDiscoveryConfig.provide(new HostsDiscoveryConfig(targets), NmapScanner),
                    ],
                },
            ]
        };
    },
    'WatcherDevice': (params: PlatformParameters) => {
        if (!params['target']) {
            throw new Error(`Missing target for WatcherDevice`);
        }
        
        const target = params['target'];
        const name = params.name || (target as string);
        
        if (typeof target !== 'string') {
            throw new Error(`Invalid target configuration for WatcherDevice device "${name}"`)   ;
        }
        
        let interval = params.interval;
        
        if (!!interval && typeof interval === 'string') {
            try {
                interval = parseInt(interval);
            } catch (err) {
                throw new Error(`Invalid interval specified for HostsDiscovery device ${name}`);
            }
        }
        
        return {
            plugin: HostDiscoveryPlugin,
            devices: [
                {
                    class: WatcherDevice,
                    name: name,
                    providers: [
                        ...WatcherDeviceConfig.provide(target, NmapScanner, interval),
                    ]
                }
            ]
        };
    }
}