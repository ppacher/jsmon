import {App, bootstrapApp, Injector} from '@jsmon/core';
import {DeviceManager, DeviceManagerModule, Logger} from '@jsmon/platform';
import {SensorStorageManager, provideStorageAdapter} from '@jsmon/platform/storage';
import {JsonStore, JsonStoreConfig} from '@jsmon/plugin-storage-file';
import {HTTPServerPlugin, HTTPServer, DeviceHttpApiPlugin, DeviceHttpApi, DeviceHttpApiConfig} from '@jsmon/plugin-httpserver';
import {MqttPlugin, MqttDeviceManagerProxyPlugin} from '@jsmon/plugin-mqtt';

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