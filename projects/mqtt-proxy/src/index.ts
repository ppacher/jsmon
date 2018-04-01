import {App, bootstrapApp, Injector} from '@homebot/core';
import {DeviceManager, DeviceManagerModule, Logger} from '@homebot/platform';
import {HTTPServerPlugin, HTTPServer, DeviceHttpApiPlugin, DeviceHttpApi, DeviceHttpApiConfig} from '@homebot/plugin-httpserver';

import {MqttPlugin, MqttDeviceManagerProxyPlugin} from '@homebot/plugin-mqtt';

import * as minimist from 'minimist';

@App({
    plugins: [
        HTTPServerPlugin,
        DeviceManagerModule,
        DeviceHttpApiPlugin,
        MqttPlugin,
        MqttDeviceManagerProxyPlugin
    ],
    providers: [
        Logger
    ]
})
export class MqttProxyApp {
    constructor(private _device: DeviceManager,
                private _server: HTTPServer) {
        this._server.listen(9080);
    }

}

bootstrapApp(MqttProxyApp);