import {Type, OnDestroy} from '@jsmon/core';
import {ProcedureCallResponse, ProcedureCallRequest, BarRequest, BarResponse, google} from '../proto';
import {Handle, getServerHandlers, Server, getServerMetadata} from './annotations';
import {ServerChannel, ServerTransport, Headers, Request} from './transport';
import {Subscription} from 'rxjs/Subscription';
import {Subject} from 'rxjs/Subject';
import {takeUntil} from 'rxjs/operators';

import * as protobuf from 'protobufjs';

export class Context {

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
    private _destroyed: Subject<void> = new Subject();

    constructor(root: protobuf.Root|string,
                server: T,
                private _transport: ServerTransport) {
                
        super(root, server);
        
        this._transport.onConnection
            .pipe(takeUntil(this._destroyed))
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
        console.log(`Client ${channel.client} connected`);
        
        channel.onRequest
            .pipe(takeUntil(this._destroyed))
            .subscribe(
                request => this._serveRequest(request),
                err => {

                },
                () => {
                    console.log(`Client ${channel.client} disconnected`);
                }
            )
    }
    
    private async _serveRequest(request: Request) {
        const method = this._serviceDescriptor!.methods[request.method];
        
        if (method === undefined) {
            // TODO: complete with error
            return;
        }

        // Make sure the method has been completely resolved
        if (!method.resolved) {
            method.resolve();
        }
        
        if (method.resolvedRequestType!.fullName !== request.requestMessage.type_url) {
            // TODO: complete with error
            return
        }
        
        if (!request.requestMessage.value) {
            // TODO: complete with error
            return;
        }
        
        const requestMessage = method.resolvedRequestType!.decode(request.requestMessage.value!);
        const ctx = new Context();
        let responseMessage: protobuf.Message<any>;

        try {
            responseMessage = await this.dispatch(request.method, ctx, requestMessage);
        } catch (err) {
            // TODO: complete with error
            return;
        }
        
        if (!!responseMessage.$type) {
            if (responseMessage.$type.name !== method.requestType) {
                // TODO: complete with error
                return;
            }
        }
        
        const result = google.protobuf.Any.create({
            type_url: method.resolvedResponseType!.fullName,
            value: method.resolvedResponseType!.encode(responseMessage).finish()
        });

        request.resolve(result, {/* TODO: add headers */});
    }

    private _shutdown() {
        if (!this._destroyed.closed) {
            this._destroyed.next();
            this._destroyed.complete();
        }
    }
}