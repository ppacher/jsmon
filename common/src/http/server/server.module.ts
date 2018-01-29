import {Module} from '@homebot/core';
import {HTTPServer} from './server';

@Module({
    exports: [
        HTTPServer
    ]
})
export class HTTPServerModule {

}
