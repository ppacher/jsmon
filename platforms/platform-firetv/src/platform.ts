
import {PlatformParameters, PlatformFactories} from '@homebot/platform';
import { FireTVPlugin } from './index';
import {FireTVDevice, FireTVConfig} from './firetv.device';

export * from './firetv.device';
export * from './index';

export const homebot: PlatformFactories = {
    'FireTV': (params: PlatformParameters) => {
        if (!params['host']) {
            throw new Error(`Missing hostname for FireTV`);
        }
        let name = params.name || 'FireTV';
        let interval = params.interval;
        
        if (!!interval && typeof interval === 'string') {
            interval = parseInt(interval);
        } 
        
        return {
            plugin: FireTVPlugin,
            devices: [{
                class: FireTVDevice,
                name: name || 'FireTV',
                providers: [
                    FireTVConfig.provide(new FireTVConfig(params['host'], interval)),
                ],
            }]
        };
    }
}