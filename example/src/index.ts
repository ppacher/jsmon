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

import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/combineLatest';

@Module({
    imports: [
        HTTPServerModule,
        NotificationModule,
        DeviceManagerModule.forRoot(),
        MPDModule,
    ],
    exports: [
        MPDConfig.new(),
    ]
})
export class App {
    constructor(private _device: DeviceManager,
                private _server: HTTPServer,
                private _notify: NotificationService) {
        this._server.listen(9080);
        
        let controller = this._device.setupDevice('mpd:localhost', MPDDevice, 'description', MPDConfig.new());
        
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