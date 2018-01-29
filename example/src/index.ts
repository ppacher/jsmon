import {Module, bootstrapModule} from '@homebot/core';
import {HTTPServerModule, HTTPServer} from '@homebot/common';

@Module({
    imports: [
        HTTPServerModule
    ]
})
export class App {
    constructor(private _server: HTTPServer) {
        console.log('bootstrapped');

        this._server.listen(9080);

        this._server.register('get', '/foobar/:msg', (req, res) => {
            res.send({msg: req.params.msg});
        });
    } 
}

bootstrapModule(App);