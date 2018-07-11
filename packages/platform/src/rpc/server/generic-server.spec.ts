import {Request, Headers, ServerChannel, ServerTransport} from './transport';
import {GenericRPCServer} from './server';
import {Handle, Server} from './annotations';
import * as protobuf from 'protobufjs';
import * as proto from '../../proto';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {take} from 'rxjs/operators';

const protoStr = `
syntax = "proto3";

message Request {
    string echo = 1;
}

message Response {
    string echo = 1;
}

service EchoService {
    rpc Echo(Request) returns (Response) {}
}
`;
const root = protobuf.parse(protoStr);

@Server('EchoService')
class EchoService {

    response: any = undefined;
    
    throw: any = undefined;
    
    calls: Subject<any> = new Subject();

    @Handle('Echo')
    async echo(ctx: Context, request: any): Promise<any> {
        setTimeout(() => this.calls.next(request), 1);

        if (this.throw !== undefined) {
            throw this.throw;
        }

        return this.response;
    }
}

export class TestRequest implements Request {
    _resolved: proto.google.protobuf.IAny|null = null;
    _failed: string|null = null;
    
    get resolved() { return this._resolved !== null; }
    get failed() { return this._failed !== null; }
    
    /* The name of the method to invoke */
    method: string;
    
    /* The method parameter */
    requestMessage: Readonly<proto.google.protobuf.IAny>;
    
    /** Request headers */
    headers: Readonly<Headers>;
    
    /* Sends the response to the client */
    async resolve(response: proto.google.protobuf.IAny, headers?: Headers): Promise<void> {
        this._resolved = response;
    }
    
    /* Send an error message to the client */
    async fail(errorMessage: string): Promise<void> {
        this._failed = errorMessage;
    }

    hasBeenResolved(response: proto.google.protobuf.IAny): boolean {
        if (this._resolved === null) {
            return false;
        }
        
        return response.type_url === this._resolved.type_url && response.value.toString() === this._resolved.value.toString();
    }
    
    hasBeenFailed(msg?: string): boolean {
        if (msg === undefined) {
            return this._failed !== null;
        }
        
        let res = this._failed === msg;
        if (!res) {
            console.log(`Expected failure message to be "${msg}" but got "${this._failed}"`);
        }
        return res;
    }
}

export class TestChannel implements ServerChannel {
    public requests: Subject<Request> = new Subject();
    public client: string;
    
    public hasBeenSubscribed: boolean = false;
    public hasBeenUnsubscribed: boolean = false;

    get onRequest(): Observable<Request> {
        return new Observable(observer => {
            this.hasBeenSubscribed = true;
            let sub = this.requests.subscribe(res => observer.next(res), err => observer.error(err), () => observer.complete());

            return () => {
                this.hasBeenUnsubscribed = true;
                sub.unsubscribe();
            }
        })
    }

}

export class TestTransport implements ServerTransport {
    public connections: Subject<ServerChannel> = new Subject();
    
    public hasBeenSubscribed: boolean = false;
    public hasBeenUnsubcribed: boolean = false;

    get onConnection(): Observable<ServerChannel> {
        return new Observable(observer => {
            this.hasBeenSubscribed = true;
            let sub = this.connections.subscribe(res => observer.next(res), err => observer.error(err), () => observer.complete());

            return () => {
                this.hasBeenUnsubcribed = true;
                sub.unsubscribe();
            }
        });
    }
}

describe('GenericServer', () => {
    let server: GenericRPCServer<EchoService>;
    let transport: TestTransport;
    let service: EchoService;

    beforeEach(() => {
        transport = new TestTransport();
        service = new EchoService();
        server = new GenericRPCServer(root.root, service, transport);
    });
    
    afterEach(() => {
        transport.connections.complete();
    });

    it('should correctly subscribe to the transport', () => {
        expect(transport.hasBeenSubscribed).toBeTruthy();
    });

    describe('clients', () => {
        it('should subscribe to client requests', () => {
            let channel = new TestChannel();

            transport.connections.next(channel);

            expect(channel.hasBeenSubscribed).toBeTruthy();
            
            channel.requests.complete();
        });

        it('should unsubscribe from clients when the transport is closed', () => {
            let channel = new TestChannel();
            transport.connections.next(channel);
            
            transport.connections.complete();
            expect(channel.hasBeenUnsubscribed).toBeTruthy();
        });
        
        it('should unsubscribe from clients and the transport if the server is destroyed', () => {
            let channel = new TestChannel();
            transport.connections.next(channel);
            
            server.onDestroy();
            
            expect(channel.hasBeenUnsubscribed).toBeTruthy();
            expect(transport.hasBeenUnsubcribed).toBeTruthy();
        });

        describe('requests', () => {
            let channel = new TestChannel();

            beforeEach(() => {
                transport.connections.next(channel);
            });

            it('should return an error for invalid method names requests', () => {
                const request = new TestRequest();
                request.method = 'unknown';
                
                channel.requests.next(request);
                
                expect(request.hasBeenFailed('Missing method name')).toBeTruthy();
            });

            it('should return an error if the body is missing', () => {
                const request = new TestRequest();
                request.method = 'Echo';

                channel.requests.next(request);
                expect(request.hasBeenFailed('Missing request body')).toBeTruthy();
            });

            it('should return an error if the request body is missing', () => {
                const request = new TestRequest();
                request.method = 'Echo';
                
                request.requestMessage = proto.google.protobuf.Any.create({type_url: '.Request', value: null});

                channel.requests.next(request);
                expect(request.hasBeenFailed('Missing request body')).toBeTruthy();
            });

            it('should fail for wrong request type_url', () =>{
                const request = new TestRequest();
                request.method = 'Echo';
                
                request.requestMessage = proto.google.protobuf.Any.create({type_url: '.Response'});

                channel.requests.next(request);
                expect(request.hasBeenFailed('Internal server error')).toBeTruthy();
            });

            it('should successfully resolve the request', () => {
                const request = new TestRequest();
                request.method = 'Echo';
                
                request.requestMessage = proto.google.protobuf.Any.create({type_url: '.Request', value: root.root.lookupType('Request').encode({echo: "foo"}).finish()});
                const response = root.root.lookupType('Response').create({echo: 'foo'});
                const responseAny = proto.google.protobuf.Any.create({type_url: response.$type.fullName, value: response.$type.encode(response).finish()});
                
                service.response = response;

                return new Promise((resolve, recjet) => {
                    service.calls.pipe(take(1))
                        .subscribe(() => {
                            expect(request.hasBeenResolved(responseAny)).toBeTruthy();
                            resolve();
                        });

                    channel.requests.next(request);
                });
            });

            it('should return an error if the handler throws', () => {
                const request = new TestRequest();
                request.method = 'Echo';
                
                request.requestMessage = proto.google.protobuf.Any.create({type_url: '.Request', value: root.root.lookupType('Request').encode({echo: "foo"}).finish()});
                const response = root.root.lookupType('Response').create({echo: 'foo'});
                const responseAny = proto.google.protobuf.Any.create({type_url: response.$type.fullName, value: response.$type.encode(response).finish()});

                service.throw = new Error(`Something went wrong`);

                return new Promise((resolve, _) => {
                    service.calls.pipe(take(1))
                        .subscribe(() => {
                            expect(request.hasBeenFailed('Internal server error')).toBeTruthy()
                            resolve();
                        });

                    channel.requests.next(request);
                });
            });

            it('should return if the handle returns no response', () => {
                const request = new TestRequest();
                request.method = 'Echo';
                
                request.requestMessage = proto.google.protobuf.Any.create({type_url: '.Request', value: root.root.lookupType('Request').encode({echo: "foo"}).finish()});
                const response = root.root.lookupType('Response').create({echo: 'foo'});
                const responseAny = proto.google.protobuf.Any.create({type_url: response.$type.fullName, value: response.$type.encode(response).finish()});

                //service.throw = new Error(`Something went wrong`);

                return new Promise((resolve, _) => {
                    service.calls.pipe(take(1))
                        .subscribe(() => {
                            expect(request.hasBeenFailed('Internal server error')).toBeTruthy()
                            resolve();
                        });

                    channel.requests.next(request);
                });
            })
        });
    });
});