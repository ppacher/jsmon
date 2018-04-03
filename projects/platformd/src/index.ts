import {App, bootstrapApp, Injector, } from '@homebot/core';
import {PlatformLoader, loadSkillConfig, DeviceManager, DeviceManagerModule, DeviceController, Logger} from '@homebot/platform';
import {MqttPlugin, MqttDeviceApiPlugin, MqttDeviceManagerProxyPlugin} from '@homebot/plugin-mqtt';

import * as minimist from 'minimist';

@App({
    plugins: [
        DeviceManagerModule,
        MqttPlugin,
        MqttDeviceApiPlugin,
    ],
    providers: [
        Logger
    ]
})
export class PlatformDaemon {
    constructor(private _device: DeviceManager,
                private _injector: Injector) {
        
        let args = minimist(process.argv.slice(2));
        let pluginDirs = args['plugin-dir'];
        if (pluginDirs === undefined) {
            pluginDirs = [];
        } else {
            if (!Array.isArray(pluginDirs)) {
                pluginDirs = [pluginDirs];
            }
        }
        
        let loader = new PlatformLoader(this._injector, this._device, pluginDirs);
        let cfg = loadSkillConfig(args.config);
        
        cfg.forEach(plugin => {
            plugin.enable.forEach(skill => {
                loader.bootstrap(plugin.plugin, skill.type, skill.params)
                    .then(instances => 
                        instances.forEach(instance => console.log('Created skill ' + instance.name + ' with description ' + instance.description)));
            });
        });

    }
}

bootstrapApp(PlatformDaemon);