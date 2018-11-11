import {Injectable, PROP_METADATA, Type, Inject, Optional, Logger, NoopLogAdapter, Injector, isType, ProviderToken, InjectionToken} from '@jsmon/core';
import {RequestSettings, Get, Post, Put, Patch, Delete, Use, Middleware} from './annotations';
import * as restify from 'restify';
import { ResolvedProperty, ResolvedPropertyRef } from './parameters';
import { DefinitionResolver } from './parameter-internals';

export const SERVER_OPTIONS = 'SERVER_OPTIONS';


/**
 * HTTPServer provides a simple HTTP server interface
 * 
 * Wraps the {@link restify.Server} class and uses {@link restify#createServer}
 */
@Injectable()
export class HttpServer {
    private _routes: Map<any, BoundRequestSettings> = new Map();
    private _disableValidation: boolean = false;

    /**
     * Access to the actual restify server object
     */
    public readonly server: restify.Server;

    constructor(@Inject(SERVER_OPTIONS) @Optional() options?: restify.ServerOptions,
                @Optional() private _log: Logger = new Logger(new NoopLogAdapter),
                @Optional() private _resolver: DefinitionResolver = DefinitionResolver.default,
                @Optional() private _injector?: Injector) {

        this._log = this._log.createChild('http-server');

        this.server = restify.createServer(options);

        this.server.on('after', (req: restify.Request, res: restify.Response) => {
            this._log.info(`${res.statusCode} ${req.method} ${req.url}`);
        });
    }
    
    /**
     * Add a list of middleware to the server.
     * @see resitfy.Server#use
     * 
     * @param handlers - A list of handler to use
     */
    use(...handlers: restify.RequestHandlerType[]): this {
        this.server.use(...handlers);
        return this;
    }
    
    /**
     * Enables the bodyParser plugin
     * @see restify.plugins.bodyParser
     * 
     * @param options - Options for the body parser
     */
    withBodyParser(options: restify.plugins.BodyParserOptions): this {
        this.use(restify.plugins.bodyParser(options));
        return this;
    }
    
    /**
     * Enabled the queryParser plugin
     * @see restify.plugins.queryParser
     * 
     * @param options - Options for the query parser
     */
    withQueryParser(options: restify.plugins.QueryParserOptions): this {
        this.use(restify.plugins.queryParser(options));
        return this;
    }
    
    /**
     * Configures the definition resolver to use
     * 
     * @param resolver - The definition resolver to use
     */
    setDefinitionResolver(resolver: DefinitionResolver): this {
        this._resolver = resolver;
        return this;
    }
    
    /**
     * Disables request parameter and body validation
     */
    disableValidation(): this {
        this._disableValidation = true;
        return this;
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
        const handlers = getAnnotations(proto.constructor, this._resolver);
        const routes: restify.Route[] = [];
        
        handlers.forEach(route => routes.push(this._createRoute(prefix, route, obj)));
        
        return routes;
    }
    
    private _createValidator(handler: any): restify.RequestHandler {
        return (req: restify.Request, res: restify.Response, next: restify.Next) => {
            const def = this._routes.get(handler);
            
            if (!def) {
                // If we don't have a route definition, skip the validation
                return next();
            }
            
            // TODO(ppacher): actually validate the request
            console.log(`validating request against def`, def);

            next();
        }
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
        const mainHandler = handler[spec.propertyKey].bind(handler);
        const handlers: restify.RequestHandler[] = [];
        
        if (!this._disableValidation) {
            handlers.push(this._createValidator(mainHandler));
        }
        
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
            mainHandler
        );

        this._routes.set(mainHandler, spec);

        this._log.info(`Mounting ${handlerClassName}.${spec.propertyKey} on "${spec.method} ${prefix}${spec.route}"`);
        
        return fn!.apply(this.server, [
            prefix + spec.route,
            ...handlers
        ]);
    }
}

export interface BoundRequestSettings extends  RequestSettings {
    middleware: Use[];
    propertyKey: string;
    parameters: {
        [key: string]: ResolvedProperty;
    },
    body?: ResolvedProperty | ResolvedPropertyRef;
}

export function getAnnotations(cls: Type<any>, resolver: DefinitionResolver): BoundRequestSettings[] {
    const annotations = Reflect.getOwnPropertyDescriptor(cls, PROP_METADATA);
    const settings: BoundRequestSettings[] = [];
    if (annotations === undefined) {
        return settings;
    } 
    
    Object.keys(annotations.value)
        .forEach(key => {
            const verbs: RequestSettings[] = annotations.value[key].filter((a: any) => {
                return a instanceof Get ||
                       a instanceof Post ||
                       a instanceof Put ||
                       a instanceof Patch ||
                       a instanceof Delete;
            });
            
            const middlewares: Use[] = annotations.value[key].filter((a: any) => a instanceof Use);

            if (verbs.length === 0) { return; }
            
            verbs.forEach(setting => {
                let parameters: {
                    [key: string]: ResolvedProperty;
                } = {};
                let bodyDef: any;

                if (setting.definition) {
                    Object.keys(setting.definition.parameters || {})
                        .forEach(parameterName => {
                            const def = setting.definition!.parameters![parameterName];
                            let resolved: any;

                            if (typeof def === 'string') {
                                resolved = {
                                    type: def,
                                }
                            } else {
                                resolved = def;
                            }
                            
                            parameters[parameterName] = resolved;
                        });
                        
                    if (setting.definition.body) {
                        const body = setting.definition.body;
                        if (typeof body === 'string') {
                            bodyDef = {
                                type: body
                            }
                        } else
                        if (isType(body)) {
                            bodyDef = resolver.resolve(body);
                        } else {
                            bodyDef = body;
                        }
                    }
                }
                
                settings.push({
                    ...setting,
                    propertyKey: key,
                    middleware: middlewares,
                    parameters: parameters,
                    body: bodyDef,
                });
            });
        });

    return settings;
}