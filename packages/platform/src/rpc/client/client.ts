import {Type} from '@jsmon/core';
import {ClientTransport, Response, TransportResponse} from "./transport";
import * as protobuf from 'protobufjs';
import {google} from '../../proto';
import {Observable} from 'rxjs/Observable';
import {takeUntil, observeOn} from 'rxjs/operators';
import {interval} from 'rxjs/observable/interval';
import { Subscription } from 'rxjs/Subscription';

/**
 * RPC request related options 
 */
export interface RequestOptions {
    /** An optional timeout for the RPC in milliseconds */
    timeout?: number;
}

type ClientImpl<T> = {
    [P in keyof T]: T[P] extends (arg1: infer U, ...rest: any[]) => infer R
        ? (_: U, opts?: RequestOptions) => R extends Observable<infer X> ? Observable<Response<X>> : Observable<Response<R>>
        : T[P];
}


export type Client<T> = RPCClient<T>&ClientImpl<T>;

/**
 * RPCClient is a generic protobuf based RPC client. 
 *
 * @requires Protbufjs Reflection capabilities
 */
export class RPCClient<T> {

    /**
     * Creates a new RPCClient for a protobuf service definition. The returned object contains functions for all
     * service methods defined in the protobuf descriptor.
     * 
     * @param {protobuf.Service} root - The protobufjs service descriptor
     * @param {ClientTransport} transport - The client transport imlementation to use 
     *
     * @returns {ClientImpl<T> & RPCClient<T>}
     */
    static create<T extends Object>(root: protobuf.Service, transport: ClientTransport): ClientImpl<T>&RPCClient<T> {
        const rpcCli = new RPCClient(root, transport);
        
        // Construct a proxy object that executes a protobuf service method based on the used
        // property name
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
        private _defaults: RequestOptions = {},
    ) {}
    
    /**
     * @internal
     * 
     * Creates a method handler function based on the given {@link PropertyKey} and
     * the protobuf service descriptor
     * 
     * @param {PropertyKey} prop - The name of the method to look up
     */
    private _getMethodHandler(prop: PropertyKey): (request: protobuf.Message<any>, options?: RequestOptions) => Observable<Response<any>> {
        const name = prop.toString().toLowerCase();
        const method = this._root.methodsArray.find(m => m.name.toLowerCase() === name || m.fullName.toLowerCase() === name)!;

        return (request: protobuf.Message<any>, options?: RequestOptions) => {
            return new Observable<Response<any>>(observer => {
                if (!options) {
                    options = {
                        timeout: this._defaults.timeout,
                    };
                }

                const payload = google.protobuf.Any.create({
                    type_url: method.resolvedRequestType!.fullName,
                    value: method.resolvedRequestType!.encode(request).finish()
                });
                
                if (!!options.timeout && options.timeout > 0) {
                    let teardown: Subscription = interval(options.timeout)
                        .subscribe(() => {
                            if (observer.closed) {
                                return;
                            }
                            observer.error(new Error('Timeout'));
                            observer.complete();
                        });
                    observer.add(teardown);
                }
                
                this._transport.send(method.fullName, payload, {})
                    .then((response: TransportResponse) => {
                        // Discard the response if the observer has already been closed
                        if (observer.closed) {
                            return;
                        }
                        
                        if (!!response.payload.type_url && response.payload.type_url !== method.resolvedResponseType!.fullName) {
                            observer.error(new Error(`Invalid response message type received for ${method.fullName}`));
                            return;
                        }
                        
                        const parsedBody = method.resolvedResponseType!.decode(response.payload.value!);

                        observer.next({
                            headers: {},
                            body: parsedBody,
                        });
                        observer.complete();
                    })
                    .catch(err => {
                        observer.error(err);
                    });
                    
                return () => {
                    observer.unsubscribe();
                }
            });
        }
    }
}
