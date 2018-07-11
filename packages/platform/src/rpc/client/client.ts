import {Type} from '@jsmon/core';
import {ClientTransport, Response} from "./transport";
import * as protobuf from 'protobufjs';
import {google} from '../../proto';

export type ClientImpl<T> = {
    [P in keyof T]: T[P] extends (arg1: infer U, ...rest: any[]) => infer R
        ? (_: U) => R extends Promise<infer X> ? Promise<Response<X>> : Promise<Response<R>>
        : T[P];
}

export type Client<T> = RPCClient<T>&ClientImpl<T>;

export class RPCClient<T> {
    static create<T extends Object>(root: protobuf.Service, transport: ClientTransport): ClientImpl<T>&RPCClient<T> {
        const rpcCli = new RPCClient(root, transport);
        
        return new Proxy<T>(rpcCli as any, {
            get: function(target: T, prop: PropertyKey, receiver: any) {
                const name = prop.toString().toLowerCase();
                const method = rpcCli._root.methodsArray.find(m => m.name.toLowerCase() === name || m.fullName.toLowerCase() === name);
                
                if (!!method) {
                    return rpcCli._getMethodHandler(prop);
                }
                
                return (target as any)[prop];
            }
        }) as any as ClientImpl<T>&RPCClient<T>;
    }
    
    private constructor(
        private _root: protobuf.Service,
        private _transport: ClientTransport,
    ) {}
    
    private _getMethodHandler(prop: PropertyKey): (request: protobuf.Message<any>) => Promise<Response<any>> {
        const name = prop.toString().toLowerCase();
        const method = this._root.methodsArray.find(m => m.name.toLowerCase() === name || m.fullName.toLowerCase() === name)!;

        return async (request: protobuf.Message<any>) => {
            const payload = google.protobuf.Any.create({
                type_url: method.resolvedRequestType!.fullName,
                value: method.resolvedRequestType!.encode(request).finish()
            });
            
            const response = await this._transport.send(method.fullName, payload, {})
            
            if (!!response.payload.type_url && response.payload.type_url !== method.resolvedResponseType!.fullName) {
                throw new Error(`Invalid response message type received for ${method.fullName}`);
            }
            
            const parsedBody = method.resolvedResponseType!.decode(response.payload.value!);

            return {
                headers: {},
                body: parsedBody,
            };
        }
    }
}
