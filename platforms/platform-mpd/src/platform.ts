import { PlatformParameters, PlatformFactories } from '@jsmon/platform';
import {MPDPlugin, MPDConfig} from './index';
import {MPDDevice} from './mpd.device';

export * from './mpd.device';
export * from './index';

export const jsmon: PlatformFactories = {
    'MPD': (params: PlatformParameters) => {
        let {
            address,
            port,
            username,
            password,
            name
        } = params;
        
        return {
            plugin: MPDPlugin,
            devices: [
                {
                    class: MPDDevice,
                    name: name || 'mpd',
                    providers: [
                        MPDConfig.provide(
                            new MPDConfig(address, port, username, password)
                        )
                    ],
                }
            ]
        }
    }
}