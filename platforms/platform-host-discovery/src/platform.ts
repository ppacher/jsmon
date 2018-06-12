import {PlatformParameters, PlatformFactories, PlatformSpec} from '@homebot/platform';
import { HostDiscoveryPlugin } from './index';
import {HostsDiscoveryConfig, HostsDiscoveryDevice} from './host-discovery.device';
import {NmapScanner} from './scanners';

export const homebot: PlatformFactories = {
    'HostsDiscovery': (params: PlatformParameters) => {
        if (!params['target']) {
            throw new Error(`Missing targets for HostDiscovery`);
        }
        
        const name = params.name || 'hosts';
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
            devices: [{
                class: HostsDiscoveryDevice,
                name: name,
                providers: [
                    ...HostsDiscoveryConfig.provide(new HostsDiscoveryConfig(targets), NmapScanner),
                ],
            }]
        };
    }
}