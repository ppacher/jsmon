import {PlatformParameters, PlatformFactories, PlatformSpec} from '@homebot/platform';
import { HostDiscoveryPlugin } from './index';
import {HostsDiscoveryConfig, HostsDiscoveryDevice} from './host-discovery.device';
import {NmapScanner} from './scanners';

export const homebot: PlatformFactories = {
    'HostsDiscovery': (params: PlatformParameters) => {
        if (!params['target']) {
            throw new Error(`Missing targets for HostDiscovery`);
        }
        
        if (!Array.isArray(params['target']) && typeof params['target'] !== 'string') {
            throw new Error(`Invalid target configuration for HostDiscovery`)   ;
        }
        
        let name = params.name || 'hosts';
        let targets = params['target'];
        
        return {
            plugin: HostDiscoveryPlugin,
            devices: [{
                class: HostsDiscoveryDevice,
                name: name,
                providers: [
                    ...HostsDiscoveryConfig.provide(new HostsDiscoveryConfig(params['target']), NmapScanner),
                ],
            }]
        };
    }
}