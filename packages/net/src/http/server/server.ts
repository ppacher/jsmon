import {Injectable, PROP_METADATA, Type} from '@jsmon/core';
import {HttpVerb, RequestSettings, Get, Post, Put, Patch, Delete} from './annotations';
import * as restify from 'restify';


/** The definition of a request handler function  */
export interface HTTPHandler {
    (req: restify.Request, res: restify.Response): void;
}

export interface RemoveRouteFn {
    (): void;
};

/**
 * HTTPServer provides a simple HTTP server interface
 * 
 * It basically wraps the `restify` package.
 * 
 */
@Injectable()
export class HTTPServer {
    private _server: restify.Server;
    
    get server(): restify.Server {
        return this._server;
    }
    
    constructor() {
        this._server = restify.createServer();
        
        this._server.use(restify.plugins.bodyParser({mapParams: false}));
        this._server.use(restify.plugins.queryParser());
    }

    mount(handler: any): void {
        const proto = Object.getPrototypeOf(handler);
        const settings = getAnnotations(proto);
    }
    
    /** Listen starts listening on incoming requests */
    listen(where: number|string): void {
        if (this._server.listening) {
            throw new Error(`HTTPServer already listening`);
        }
        
        this._server.listen(where);
    }
    
    /** Registers a new listener for the given HTTP verb and URL */
    register(verb: HttpVerb, route: RegExp|string|restify.RouteOptions, handler: HTTPHandler): RemoveRouteFn {
        let m: Function = (this._server as any)[verb] as Function;

        if (m === undefined) {
            throw new Error(`Unsupported HTTP verb: ${verb}`);
        }
        
        let h = (req: restify.Request, res: restify.Response, next: any) => {
            try {
                handler(req, res);
            } catch (err) {
                res.send(err);
            }
            
            next(false);
        }
        
        let result: restify.Route = m.apply(this._server, [route, handler]);

        return () => {
            // BUG(ppacher): according to typings it should be a string, according to docs we pass in the "blob" result of a mount call
            // We CAN pass in the whole route
            // TODO(ppacher): check if it removes all verb handlers, if so -> BUG
            this._server.rm(result as any);
        }
    }
}

interface BoundRequestSettings extends  RequestSettings {
    propertyKey: string;
}

function getAnnotations(cls: Type<any>): BoundRequestSettings[] {
    const annotations = Reflect.getOwnPropertyDescriptor(cls, PROP_METADATA);
    const settings: BoundRequestSettings[] = [];
    if (annotations === undefined) {
        return settings;
    } 
    
    Object.keys(annotations.value)
        .forEach(key => {
            const opt: any[] = annotations.value[key].filter((a: any) => {
                return a instanceof Get ||
                       a instanceof Post ||
                       a instanceof Put ||
                       a instanceof Patch ||
                       a instanceof Delete;
            });

            if (opt.length === 0) { return; }
            
            opt.forEach(setting => settings.push({
                ...setting,
                propertyKey: key,
            }));
        });

    return settings;
}