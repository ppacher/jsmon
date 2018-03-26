import {App, bootstrapApp, Injector, DeviceManager, DeviceManagerModule, DeviceController, Logger} from '@homebot/core';
import {SkillLoader, loadSkillConfig} from '@homebot/core';
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
export class ExampleApp {
    constructor(private _device: DeviceManager,
                private _injector: Injector) {
        
        let args = minimist(process.argv.slice(2));
        let pluginDirs = args['plugin-dir'];
        if (pluginDirs !== undefined && !Array.isArray(pluginDirs)) {
            pluginDirs = [pluginDirs];
        }
        
        let loader = new SkillLoader(this._injector, this._device, pluginDirs);
        let cfg = loadSkillConfig(args.config);
        
        cfg.forEach(plugin => {
            plugin.enable.forEach(skill => {
                loader.bootstrapSkill(plugin.plugin, skill)
                    .then((instance: DeviceController<any>) => console.log('Created skill ' + instance.name + ' with description ' + instance.description));
            });
        });

    }
}

bootstrapApp(ExampleApp);