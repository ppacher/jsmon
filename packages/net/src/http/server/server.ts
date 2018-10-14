import {Injectable, PROP_METADATA, Type, Inject, Optional, Logger, NoopLogAdapter, Injector, isType, ProviderToken, InjectionToken} from '@jsmon/core';
import {RequestSettings, Get, Post, Put, Patch, Delete, Use, Middleware} from './annotations';
import * as restify from 'restify';

export const SERVER_OPTIONS = 'SERVER_OPTIONS';


/**
 * HTTPServer provides a simple HTTP server interface
 * 
 * Wraps the {@link restify.Server} class and uses {@link restify#createServer}
 */
@Injectable()
export class HttpServer {

    /**
     * Access to the actual restify server object
     */
    public readonly server: restify.Server;

    constructor(@Inject(SERVER_OPTIONS) @Optional() options?: restify.ServerOptions,
                @Optional() private _log: Logger = new Logger(new NoopLogAdapter),
                @Optional() private _injector?: Injector) {

        this._log = this._log.createChild('http-server');

        this.server = restify.createServer(options);

        this.server.pre((req: restify.Request, res: restify.Response, next: restify.Next) => {
            this._log.info(`${req.method} ${req.url}`);
            next();
        });
    }
    
    /**
     * Start listening
     * Wraps {@link restify.Server#listen}
     */
    listen(...args: any[]): any {
        return this.server.listen(...args);
    }

    /**
     * Mounts an object or class on a given prefix
     * 
     * @param prefix - The path prefix to use
     * @param obj - The object or class that should be mounted on the prefix
     */
    mount(prefix: string, obj: any|ProviderToken<any>): restify.Route[];
    
    /**
     * Mounts an object or class on the HttpServer root path
     * 
     * @param obj - The object or class to mount
     */
    mount(obj: any|ProviderToken<any>): restify.Route[];
    
    mount(...args: any[]): restify.Route[] {
        let obj: any|ProviderToken<any>;
        let prefix: string;
        
        if (args.length === 2) {
            prefix = args[0];
            obj = args[1];
        } else
        if (args.length === 1) {
            prefix = '';
            obj = args[0];
        } else {
            throw new Error(`Invalid number of arguments`);
        }
    
        if (isType(obj)) {
            if (!this._injector) {
                throw new Error(`Cannot use type in call to mount() without an injector`);
            }
            
            obj = this._injector.get(obj);
        }
        
        const proto = Object.getPrototypeOf(obj);
        const handlers = getAnnotations(proto.constructor);
        const routes: restify.Route[] = [];
        
        handlers.forEach(route => routes.push(this._createRoute(prefix, route, obj)));
        
        return routes;
    }
    
    private _createRoute(prefix: string, spec: BoundRequestSettings, handler: any): restify.Route {
        let handlerKey: keyof restify.Server;
        switch(spec.method) {
        case 'delete':
            handlerKey = 'del';
            break;
        default:
            handlerKey = spec.method as keyof restify.Server;
        }
        
        let fn = this.server[handlerKey] as Function;

        const handlerClassName = Object.getPrototypeOf(handler).constructor.name;

        
        // setup the handler chain
        const handlers: restify.RequestHandler[] = [];
        
        spec.middleware.forEach((use: Use) => {
            let m: Middleware;

            if (isType(use.middleware) || use.middleware instanceof InjectionToken) {
                if (!this._injector) {
                    throw new Error(`Cannot use middleware type ${use.middleware.name} without an injector`);
                }
                
                m = this._injector.get<Middleware>(use.middleware);
            } else {
                m = use.middleware;
            }

            handlers.push((req: restify.Request, res: restify.Response, next: restify.Next) => {
                return m.handle(use.options, req, res, next);
            });
        });

        handlers.push(
            handler[spec.propertyKey].bind(handler)
        );

        this._log.info(`Mounting ${handlerClassName}.${spec.propertyKey} on "${spec.method} ${spec.route}"`);
        
        return fn!.apply(this.server, [
            prefix + spec.route,
            ...handlers
        ]);
    }
}

interface BoundRequestSettings extends  RequestSettings {
    middleware: Use[];
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
            const verbs: any[] = annotations.value[key].filter((a: any) => {
                return a instanceof Get ||
                       a instanceof Post ||
                       a instanceof Put ||
                       a instanceof Patch ||
                       a instanceof Delete;
            });
            
            const middlewares: Use[] = annotations.value[key].filter((a: any) => a instanceof Use);

            if (verbs.length === 0) { return; }
            
            verbs.forEach(setting => settings.push({
                ...setting,
                propertyKey: key,
                middleware: middlewares,
            }));
        });

    return settings;
}