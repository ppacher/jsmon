import {Injectable, Logger} from '@homebot/core';

import * as restify from 'restify';

/** A set of allowed HTTP verbs */
export type HTTPVerb = 'get' | 'post' | 'put' | 'delete' | 'head' | 'trace' | 'patch';

/** The definition of a request handler function  */
export interface HTTPHandler {
    (req: restify.Request, res: restify.Response): void;
}

/**
 * HTTPServer provides a simple HTTP server interface to be used by Homebot modules
 * 
 * It basically wraps the `restify` package.
 * 
 */
@Injectable()
export class HTTPServer {
    private _server: restify.Server|undefined = undefined;
    
    constructor(private readonly log: Logger) {
        this._server = restify.createServer();
    } 
    
    /** Listen starts listening on incoming requests */
    listen(where: number|string): void {
        if (this._server.listening) {
            throw new Error(`HTTPServer already listening`);
        }
        
        this._server.listen(where);
        this.log.info(`[http] listening on ${where}`);
    }
    
    /** Registers a new listener for the given HTTP verb and URL */
    register(verb: HTTPVerb, route: RegExp|string|restify.RouteOptions, handler: HTTPHandler): void {
        let m = this._server[verb];

        if (m === undefined) {
            throw new Error(`Unsupported HTTP verb: ${verb}`);
        }
        
        m.apply(this._server, [route, handler]);
    }
}
