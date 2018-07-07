import {TestChannel,TestRequest,TestTransport} from './dummy-transport';
import {GenericRPCServer} from '../server';
import {Handle, Server} from '../annotations';
import * as protobuf from 'protobufjs';
import {google} from '../../proto';
import {Subject} from 'rxjs/Subject';
import {take} from 'rxjs/operators';

const proto = `
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
const root = protobuf.parse(proto);

@Server('EchoService')
class EchoService {

    response: any = undefined;
    
    throw: any = undefined;
    
    calls: Subject<any> = new Subject();

    @Handle('Echo')
    async echo(request: any): Promise<any> {
        setTimeout(() => this.calls.next(request), 1);

        if (this.throw !== undefined) {
            throw this.throw;
        }

        console.log(`EchoService.Echo called`);
        return this.response;
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
                
                request.requestMessage = google.protobuf.Any.create({type_url: '.Request', value: null});

                channel.requests.next(request);
                expect(request.hasBeenFailed('Missing request body')).toBeTruthy();
            });

            it('should fail for wrong request type_url', () =>{
                const request = new TestRequest();
                request.method = 'Echo';
                
                request.requestMessage = google.protobuf.Any.create({type_url: '.Response'});

                channel.requests.next(request);
                expect(request.hasBeenFailed('Internal server error')).toBeTruthy();
            });

            it('should successfully resolve the request', () => {
                const request = new TestRequest();
                request.method = 'Echo';
                
                request.requestMessage = google.protobuf.Any.create({type_url: '.Request', value: root.root.lookupType('Request').encode({echo: "foo"}).finish()});
                const response = root.root.lookupType('Response').create({echo: 'foo'});
                const responseAny = google.protobuf.Any.create({type_url: response.$type.fullName, value: response.$type.encode(response).finish()});
                
                service.response = response;

                return new Promise((resolve, recjet) => {
                    service.calls.pipe(take(1))
                        .subscribe(() => {
                            console.log(`Resolved`);
                            expect(request.hasBeenResolved(responseAny)).toBeTruthy();
                            resolve();
                        });

                    channel.requests.next(request);
                });
            });

            it('should return an error if the handler throws', () => {
                const request = new TestRequest();
                request.method = 'Echo';
                
                request.requestMessage = google.protobuf.Any.create({type_url: '.Request', value: root.root.lookupType('Request').encode({echo: "foo"}).finish()});
                const response = root.root.lookupType('Response').create({echo: 'foo'});
                const responseAny = google.protobuf.Any.create({type_url: response.$type.fullName, value: response.$type.encode(response).finish()});

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
                
                request.requestMessage = google.protobuf.Any.create({type_url: '.Request', value: root.root.lookupType('Request').encode({echo: "foo"}).finish()});
                const response = root.root.lookupType('Response').create({echo: 'foo'});
                const responseAny = google.protobuf.Any.create({type_url: response.$type.fullName, value: response.$type.encode(response).finish()});

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