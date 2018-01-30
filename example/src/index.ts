import {Module, bootstrapModule} from '@homebot/core';
import {HTTPServerModule, HTTPServer, DeviceManagerModule, DeviceManager, Device, NotificationModule, NotificationService} from '@homebot/common';

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
                name: 'foo',
                parameters: {},
                handler: (req) => {
                    this._notify.notify('Example', 'Start coding!');
                    return Promise.resolve();
                },
            }
        ]));
    } 
}

bootstrapModule(App);