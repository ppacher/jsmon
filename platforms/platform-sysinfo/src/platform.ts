import {PlatformFactories, PlatformParameters} from '@jsmon/platform';
import {SysInfoDevice} from './sysinfo.device';
import {SysInfoPlugin} from './plugin';

export * from './sysinfo.device';
export * from './index';

export const jsmon: PlatformFactories = {
    'Sysinfo': (params: PlatformParameters) => {
        return {
            plugin: SysInfoPlugin,
            devices: [
                {
                    class: SysInfoDevice,
                    name: (params && params.name) || 'sysinfo',
                }
            ]
        }
    }
}