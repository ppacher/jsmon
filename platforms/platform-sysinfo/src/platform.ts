import {PlatformFactories, PlatformParameters} from '@homebot/platform';
import {SysInfoDevice} from './sysinfo.device';
import {SysInfoPlugin} from './plugin';

export * from './sysinfo.device';
export * from './index';

export const homebot: PlatformFactories = {
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