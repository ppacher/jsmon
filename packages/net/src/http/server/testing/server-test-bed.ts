import { Provider, Type, Injector, NoopLogAdapter, Logger } from '@jsmon/core';
import { HttpServer } from '../server';
import { Middleware } from '../annotations';
import { HttpClient } from '../../client';
import { plugins } from 'restify';

export interface TestBedConfig {
    prefix?: string;
    controller: Type<any>;
    providers?: Provider[];
    clearMiddlewares: Type<Middleware>[];
}

export class HttpServerTestBed {

    get server() {
        return this._server;
    }
    
    get injector() {
        return this._injector;
    }
    
    get client() {
        return this._client;
    }

    dispose(): Promise<void> {
        return new Promise((resolve) => {
            this._server.server.close(resolve);
        });
    }
    
    hasRoute(path: string) {
        return this._server.server.router.getRoutes()
            .find((route: any) => {
                return (route.path as string).startsWith(path);
            }) != undefined;
    }

    constructor(private _injector: Injector,
                private _server: HttpServer,
                private _client: HttpClient) {}

    static create(cfg: TestBedConfig): HttpServerTestBed {
        const injector = new Injector([
            cfg.controller,
            {
                provide: Logger,
                useValue: new Logger(new NoopLogAdapter)
            },
            HttpServer,
            ...(cfg.providers || []),
            ...((cfg.clearMiddlewares || []).map(type => {
                return {
                    provide: type,
                    useValue: {
                        handle: (opt: any, req: any, res: any, next: any) => next()
                    }
                }
            }))
        ]);

        let server: HttpServer = injector.get(HttpServer);
        
        server.server.use(plugins.bodyParser())
        server.server.use(plugins.queryParser())


        server.mount(cfg.prefix || '', cfg.controller);

        server.listen(0);

        const client = new HttpClient({
            baseURL: `http://localhost:${server.server.address().port}`,
        }, injector.get(Logger));
        
        return new HttpServerTestBed(injector, server, client);
    }
}