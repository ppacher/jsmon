import {PlatformFactories, PlatformParameters} from '@jsmon/platform';
export * from './index';

import {TinkerforgeService, TinkerforgeConfig} from './tinkerforge.service';
import {TinkerforgePlugin} from './plugin';

export const jsmon: PlatformFactories = {
    'tinkerforge': (params: PlatformParameters) => {
        let host = params.host;
        let port = params.port;

        return {
            plugin: TinkerforgePlugin,
            services: [
                {
                    class: TinkerforgeService,
                    providers: [
                        {
                            provide: TinkerforgeConfig,
                            useValue: new TinkerforgeConfig(host, port),
                        }
                    ]
                }
            ]
        }
    }
}