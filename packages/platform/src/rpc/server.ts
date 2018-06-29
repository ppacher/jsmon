import {Type} from '@jsmon/core';
import {ProcedureCallResponse, ProcedureCallRequest, BarRequest, BarResponse, google} from '../proto';
import {Handle, getServerHandlers, Server, getServerMetadata} from './annotations';
import * as protobuf from 'protobufjs';

export interface HandlerFunction<T, U> {
    (req: T): Promise<U>;
}

export class RPCServer<T extends Object> {
    private _dispatchTable: Map<string, HandlerFunction<any, any>> = new Map();
    protected _serviceDescriptor: protobuf.Service|null = null;

    constructor(private _root: protobuf.Root, private _server: T) {
        this._setupHandlers();
    }
    
    dispatch<T, U>(method: string, request: T): Promise<U> {
        const handler = this._dispatchTable.get(method);
        
        if (handler === undefined) {
            return Promise.reject(`Unknown method ${method}`);
        }
        
        return handler(request);
    }
    
    async dispatchBlob<T, U>(method: string, request: Uint8Array): Promise<Uint8Array> {
        const methodDesciptor = this._serviceDescriptor!.methods[method];
        if (methodDesciptor === undefined) {
            return Promise.reject(`Unknown method`);
        }

        let requestMessage: T = methodDesciptor.resolvedRequestType!.decode(request) as any as T;
        
        let responseMessage: U = await this.dispatch<T, U>(method, requestMessage);
        
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
                
                console.log(`Registered ${cls.name}.${fn.name} for ${method.fullName}`);
            } else {
                throw new Error(`Missing method handler for ${method.fullName}`);
            }
        });
        
        this._serviceDescriptor = service;
    }
}

export class GenericRPCServer<T> extends RPCServer<T> {
    async dispatchCall(req: Uint8Array): Promise<Uint8Array> {
        const requestMessage = ProcedureCallRequest.decode(req);
        const method = this._serviceDescriptor!.methods[requestMessage.method];
        
        if (!method.resolved) {
            method.resolve();
        }

        const responseType = method.resolvedResponseType!;
        const requestType = method.resolvedRequestType!;

        const methodParameter: protobuf.Message<any> = requestType.decode(requestMessage.payload!.value!); 

        const result: protobuf.Message<any> = await super.dispatch<protobuf.Message<any>, protobuf.Message<any>>(requestMessage.method, methodParameter);
        
        const resultAny: google.protobuf.Any = google.protobuf.Any.create({
            type_url: responseType.fullName,
            value: responseType.encode(result).finish(),
        }) as any as google.protobuf.Any;

        return ProcedureCallResponse.encode({
            clientId: requestMessage.clientId,
            requestId: requestMessage.requestId,
            payload: resultAny,
        }).finish();
    }
}


//
// Test code
//

@Server('Foo')
export class Foo {

    @Handle('Bar')
    async bar(method: BarRequest): Promise<BarResponse> {
        console.log(`Bar called with: `, method);
        return new BarResponse(method);
    }
}


let root = protobuf.loadSync('./protobuf/rpc.proto');
const f = new Foo();

const server = new GenericRPCServer(root, f);

const payload = BarRequest.create({payload: 'foobar'});

const req = ProcedureCallRequest.encode({
    clientId: 'client',
    requestId: 'request-1',
    method: 'Bar',
    payload: google.protobuf.Any.create({
        type_url: '.BarRequest',
        value: BarRequest.encode(payload).finish()
    }),
}).finish();


server.dispatchCall(req)
    .then(res => {
        const msg = ProcedureCallResponse.decode(res);
        const barResponse = BarResponse.decode(msg.payload!.value!);

        console.log(barResponse);
    });