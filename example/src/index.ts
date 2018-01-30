import {Module, bootstrapModule} from '@homebot/core';
import {HTTPServerModule, HTTPServer, DeviceManagerModule, DeviceManager, Device} from '@homebot/common';

@Module({
    imports: [
        HTTPServerModule,
        DeviceManagerModule.forRoot()
    ]
})
export class App {
    constructor(private _device: DeviceManager, private _server: HTTPServer) {
        console.log('bootstrapped');

        this._server.listen(9080);

        let cancel = this._server.register('get', '/foobar/:msg', (req, res) => {
            res.send({msg: req.params.msg});
        });
        
        this._device.registerDevice(new Device.Device('dummy', [
            {
                name: 'foo',
                parameters: {},
                handler: (req) => {
                    return Promise.resolve();
                },
            }
        ]));
    } 
}

bootstrapModule(App);