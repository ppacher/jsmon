import {Module, bootstrapModule} from '@homebot/core';
import {HTTPServerModule, HTTPServer, DeviceManagerModule, DeviceManager, Device, NotificationModule, NotificationService} from '@homebot/common';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/interval';

@Module({
    imports: [
        HTTPServerModule,
        NotificationModule,
        DeviceManagerModule.forRoot(),
    ]
})
export class App {
    constructor(private _device: DeviceManager, private _server: HTTPServer, private _notify: NotificationService) {
        this._server.listen(9080);

        this._device.registerDevice(new Device.Device('dummy', [
            {
                name: 'notify',
                parameters: {
                    'msg': [Device.ParameterType.String],
                },
                handler: (params) => {
                    console.log('notifying');
                    this._notify.notify('Example', params.get('msg'));
                    return Promise.resolve(params.get('msg'));
                },
            }
        ], [
            {
                name: 'tick',
                type: Device.ParameterType.Number,
                description: 'Ticks every interval',
                onChange: Observable.interval(1000) as Observable<any>,
            }
        ]));
    } 
}

bootstrapModule(App);