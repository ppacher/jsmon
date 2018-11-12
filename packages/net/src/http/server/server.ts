import { Inject, Injectable, InjectionToken, Injector, isType, Logger, NoopLogAdapter, Optional, ProviderToken } from '@jsmon/core';
import * as restify from 'restify';
import { Middleware, Use } from './annotations';
import { DefinitionResolver } from './parameter-internals';
import { BoundRequestSettings, getAnnotations } from './server-internals';
import { Validator } from './validator';

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
                @Optional() private _validator: Validator = new Validator(),
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
     * Returns the listening address of the server
     */
    address(): restify.AddressInterface {
        return this.server.address();
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
            
            this._validator.validateRequest(def, req, res, next);
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
