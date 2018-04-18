import {App, bootstrapApp, Injector, } from '@homebot/core';
import {PlatformLoader, DeviceManager, DeviceController, Logger, PlatformModule} from '@homebot/platform';
import {MqttPlugin, MqttDeviceApiPlugin, MqttDeviceManagerProxyPlugin} from '@homebot/plugin-mqtt';

import {ConfigLoader, Config} from './config';

import * as minimist from 'minimist';

@App({
    plugins: [
        PlatformModule,
        MqttPlugin,
        MqttDeviceApiPlugin,
    ],
    providers: [
        Logger
    ]
})
export class PlatformDaemon {
    constructor(private _device: DeviceManager,
                private _injector: Injector,
                private _logger: Logger) {
        
        let args = minimist(process.argv.slice(2));
        let cfg = this.loadConfig(args.config);
        
        if (!!args['log-level']) {
            if (!['debug','info','warn','error'].includes(args['log-level'])) {
                throw new Error(`invalid log level. expected debug, info, warn or error. Got ${args['log-level']}`);
            }
            
            this._logger.info('Setting log-level to ' + args['log-level']);
            this._logger.setLogLevel(args['log-level']);
        }
        
        let loader = new PlatformLoader(this._injector, this._device, cfg.pluginDirs());
        
        cfg.forEachFeature((platform, feature) => {
            let params = {
                ...feature.params,
                name: feature.name,
            };

            loader.bootstrap(platform, feature.type, params)
                .then(instances => {
                    instances.forEach(instance => {
                        if (instance instanceof DeviceController) {
                            this._logger.info(`${platform} -> ${feature.type}: Create device with name "${instance.name}"`);
                        } else {
                            this._logger.info(`${platform} -> ${feature.type}: Create service ${instance.constructor.name}`);
                        }
                    })
                });;
        })
    }
    
    loadConfig(path: string): Config {
        let loader = new ConfigLoader(path, null /* disable file watching for now */)
        
        return loader.load();
    }
}

bootstrapApp(PlatformDaemon);
