import {App, bootstrapApp, Injector, DeviceManager, DeviceManagerModule} from '@homebot/core';
import {HTTPServerPlugin, HTTPServer, DeviceHttpApiPlugin, DeviceHttpApi, DeviceHttpApiConfig} from 'homebot-httpserver';
import {MPDPlugin, MPDConfig, MPDDevice} from 'homebot-mpd';
import {SysInfoDevice} from 'homebot-sysinfo';
import {DarkSkyWeatherService, DarkSkyNetWeatherPlugin, DarkSkyAPIConfig} from 'homebot-darksyknet';

import {Observable} from 'rxjs/Observable';

import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/combineLatest';

@App({
    plugins: [
        HTTPServerPlugin,
        DeviceManagerModule,
        MPDPlugin,
        DeviceHttpApiPlugin,
        DarkSkyNetWeatherPlugin
    ],
    providers: [
        DarkSkyAPIConfig.provide(new DarkSkyAPIConfig('', {latitude: 37.8267, longitude: -122.4233}))
    ]
})
export class ExampleApp {
    constructor(private _device: DeviceManager,
                private _server: HTTPServer,
                private _weather: DarkSkyWeatherService,
                private _httpAPI: DeviceHttpApi) {
        
        this._weather.fetch().subscribe(data => console.log(data));
        this._server.listen(9080);
        
        let info = this._device.setupDevice('sysinfo', SysInfoDevice);
        
        // Create a new device for MPD that connects to 127.0.0.1:6600 (defaults of MPDConfig.new())
        // This will expose any sensors and commands under http://localhost:9080/devices/mpd:localhost/
        let controller = this._device.setupDevice('mpd:localhost', MPDDevice, 'description', MPDConfig.new());
        
        // Setup a listener for 'title', 'artist' and 'ablum' state changes
        // on the MPD device to send desktop notifications about the current
        // track
        controller.watchSensor('title')
                    .combineLatest(
                        controller.watchSensor('artist'),
                        controller.watchSensor('album')
                    )
                    .filter(([title, artist, album]) => !!artist && !!album)
                    .distinctUntilChanged()
                    .subscribe(([title, artist, album]) => {
                        console.log(title, `${artist} - ${album}`);
                    });
    }
}

bootstrapApp(ExampleApp);