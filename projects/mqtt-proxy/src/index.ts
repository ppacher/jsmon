import {App, bootstrapApp, Injector} from '@homebot/core';
import {DeviceManager, DeviceManagerModule, Logger} from '@homebot/platform';
import {SensorStorageManager, provideStorageAdapter} from '@homebot/platform/storage';
import {JsonStore, JsonStoreConfig} from '@homebot/plugin-storage-file';
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
        Logger,
        SensorStorageManager,
        provideStorageAdapter(JsonStore),
        {provide: JsonStoreConfig, useValue: new JsonStoreConfig()}
    ]
})
export class MqttProxyApp {
    constructor(private _device: DeviceManager,
                private _server: HTTPServer,
                private _storageManager: SensorStorageManager) {
        this._server.listen(9080);
        
        console.log(`Got storage manager ${this._storageManager}`);
    }
}

bootstrapApp(MqttProxyApp);