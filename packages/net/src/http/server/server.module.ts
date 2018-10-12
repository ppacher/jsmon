import {Plugin} from '@jsmon/core';
import {HttpServer} from './server';

@Plugin({
    providers: [
        HttpServer
    ]
})
export class HTTPServerPlugin {}
