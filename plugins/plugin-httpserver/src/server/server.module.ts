import {Plugin} from '@jsmon/core';
import {HTTPServer} from './server';

@Plugin({
    providers: [
        HTTPServer
    ]
})
export class HTTPServerPlugin {}
