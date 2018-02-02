import {Module, bootstrapModule} from '@homebot/core';
import {
    HTTPServerModule,
    HTTPServer,
    DeviceManagerModule,
    DeviceManager,
    NotificationModule,
    NotificationService,
} from '@homebot/common';

import {
    MPDModule,
    MPDConfig,
    MPDDevice
} from '@homebot/common/multimedia/mpd';

import {Observable} from 'rxjs/Observable';

import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/combineLatest';

@Module({
    imports: [
        HTTPServerModule,
        NotificationModule,
        DeviceManagerModule.forRoot(),
        MPDModule,
    ],
})
export class App {
    constructor(private _device: DeviceManager,
                private _server: HTTPServer,
                private _notify: NotificationService) {
        this._server.listen(9080);
        
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
                        this._notify.notify(title, `${artist} - ${album}`);
                    });
    }
}

bootstrapModule(App);