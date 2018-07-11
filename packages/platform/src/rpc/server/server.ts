import {Type, OnDestroy} from '@jsmon/core';
import {ProcedureCallResponse, ProcedureCallRequest, google} from '../../proto';
import {Logger, NoopLogAdapter} from '../../log';
import {Handle, getServerHandlers, Server, getServerMetadata} from './annotations';
import {ServerChannel, ServerTransport, Headers, Request} from './transport';
import {Subscription} from 'rxjs/Subscription';
import {Subject} from 'rxjs/Subject';
import {takeUntil} from 'rxjs/operators';

import * as protobuf from 'protobufjs';

export class Context {
    private _headers: Headers = {};

    setHeader(name: string, value: string) {
        this._headers[name] = value;
    }
    
    getResponseHeaders(): Headers {
        return this._headers;
    }
    
    getRequestHeaders(): Headers {
        return this._reqHeaders;
    }
    
    constructor(private _reqHeaders: Headers = {}) {}
}

export interface HandlerFunction<T, U> {
    (ctx: Context, req: T): Promise<U>;
}

export class RPCServer<T extends Object> {
    private _dispatchTable: Map<string, HandlerFunction<any, any>> = new Map();
    protected _serviceDescriptor: protobuf.Service|null = null;
    protected _root: protobuf.Namespace;

    constructor(root: protobuf.Root|string, private _server: T) {
        if (typeof root === 'string') {
            this._root = protobuf.loadSync(root).resolveAll();
        } else {
            this._root = root.resolved ? root : root.resolveAll();
        }
        
        this._setupHandlers();
    }
    
    dispatch<T extends protobuf.Message<any>, U extends protobuf.Message<any>>
        (method: string, ctx: Context, request: T): Promise<U> {
        
        const handler = this._dispatchTable.get(method);
        if (handler === undefined) {
            return Promise.reject(`Unknown method ${method}`);
        }
        
        return handler(ctx, request);
    }
    
    async dispatchBlob<T extends protobuf.Message<any>, U extends protobuf.Message<any>>
        (method: string, ctx: Context, request: Uint8Array): Promise<Uint8Array> {
        
        const methodDesciptor = this._serviceDescriptor!.methods[method];
        if (methodDesciptor === undefined) {
            return Promise.reject(`Unknown method`);
        }

        let requestMessage: T = methodDesciptor.resolvedRequestType!.decode(request) as any as T;
        let responseMessage: U = await this.dispatch<T, U>(method, ctx, requestMessage);
        const response = methodDesciptor.resolvedResponseType!.encode(responseMessage).finish();
        
        return response;
    }
    
    private _setupHandlers() {
        const cls: Type<T> = this._server.constructor as Type<T>;
        
        const metadata = getServerMetadata(cls);
        if (metadata === undefined) {
            throw new Error(`Missing @Server() decorator`);
        }
        
        const handlers = getServerHandlers(cls);
        const service = this._root.lookupService(metadata.service);
        if (service === undefined) {
            throw new Error(`Unknown service defintion ${metadata.service}`);
        } 

        if (!service.resolved) {
            service.resolveAll();
        }
        
        service.methodsArray.forEach(method => {
            const handler = Object.keys(handlers).find(key => handlers[key][0].methodName === method.name);

            if (handler !== undefined) {
                const fn = (this._server as any)[handler] as HandlerFunction<any, any>;
                this._dispatchTable.set(method.name, fn.bind(this._server));
            } else {
                throw new Error(`Missing method handler for ${method.fullName}`);
            }
        });
        
        this._serviceDescriptor = service;
    }
}

export class GenericRPCServer<T> extends RPCServer<T> implements OnDestroy {
    private _destroyed: Subject<void>|null = new Subject();

    constructor(root: protobuf.Root|string,
                server: T,
                private _transport: ServerTransport,
                private _log: Logger = new Logger(new NoopLogAdapter())) {
                        
        super(root, server);
        
        this._log = this._log.createChild(`${this._serviceDescriptor!.fullName}`);
        
        this._transport.onConnection
            .pipe(takeUntil(this._destroyed!))
            .subscribe(
                channel => this._handleChannel(channel),
                err => {},
                () => this._shutdown()
            )
    }

    onDestroy() {
        this._shutdown();
    }
    
    private _handleChannel(channel: ServerChannel): void {
        this._log.info(`Client ${channel.client} connected`);
        
        channel.onRequest
            .pipe(takeUntil(this._destroyed!))
            .subscribe(
                request => this._serveRequest(request),
                err => {

                },
                () => {
                    this._log.info(`Client ${channel.client} disconnected`);
                }
            )
    }
    
    private async _serveRequest(request: Request) {
        const method = this._serviceDescriptor!.methods[request.method];
        
        if (method === undefined) {
            await request.fail('Missing method name');
            return;
        }

        this._log.debug(`serving request for ${method.name}`);

        // Make sure the method has been completely resolved
        if (!method.resolved) {
            method.resolve();
        }
        
        if (!!request.requestMessage && method.resolvedRequestType!.fullName !== request.requestMessage.type_url) {
            this._log.warn(`failed to serve request: request type and payload did not match`);
            this._log.error(`Invalid request message types. Expected ${method.resolvedRequestType!.fullName} but got ${request.requestMessage.type_url}`);
            return await request.fail('Internal server error');
        }
        
        if (!request.requestMessage || request.requestMessage.value === null || request.requestMessage.value!.length === 0) {
            this._log.warn(`failed to serve request: missing body`);
            this._log.error('missing body');
            return await request.fail('Missing request body');
        }
        
        const requestMessage = method.resolvedRequestType!.decode(request.requestMessage.value!);
        const ctx = new Context(request.headers);
        let responseMessage: protobuf.Message<any>;

        try {
            responseMessage = await this.dispatch(request.method, ctx, requestMessage);
        } catch (err) {
            return await request.fail('Internal server error');
        }
        
        if (!responseMessage) {
            this._log.error(`Handler for "${method.name}" did not return a value`);
            this._log.error('Missing response')
            return await request.fail('Internal server error');
        }
        
        // Sanity check if the responseMessage contains reflection information
        if (!!responseMessage.$type) {
            if (responseMessage.$type.name !== method.responseType) {
                this._log.error(`Wrong response type. Got: "${responseMessage.$type.name}" Expected: "${method.responseType}"`)
                return await request.fail('Internal server error');
            }
        }
        
        const result = google.protobuf.Any.create({
            type_url: method.resolvedResponseType!.fullName,
            value: method.resolvedResponseType!.encode(responseMessage).finish()
        });

        return await request.resolve(result, ctx.getResponseHeaders());
    }

    private _shutdown() {
        if (this._destroyed !== null) {
            let sub = this._destroyed!;
            this._destroyed = null;

            this._log.info(`RPCServer[${this._serviceDescriptor!.name}] shutdown`);
            sub.next();
            sub.complete();
        }
    }
}