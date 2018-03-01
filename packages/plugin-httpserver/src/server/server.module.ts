import {Plugin} from '@homebot/core';
import {HTTPServer} from './server';

@Plugin({
    providers: [
        HTTPServer
    ]
})
export class HTTPServerPlugin {}
