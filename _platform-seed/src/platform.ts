import {PlatformFactories, PlatformParameters} from '@jsmon/platform';
export * from './index';

export const jsmon: PlatformFactories = {
    'YOUR_NAME': (params: PlatformParameters) => {
        return {
            plugin: 'PluginClass',
            devices: [
                {
                    class: 'DeviceClass',
                    name: (params && params.name) || 'default-name',
                }
            ]
        }
    }
}