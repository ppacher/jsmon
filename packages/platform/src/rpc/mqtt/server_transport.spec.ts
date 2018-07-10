import {Injector} from '@jsmon/core';
import {ServerTransport} from '../transport';
import {ConsoleAdapter, useLoggingAdapter, Logger} from '../../log';
import {MqttRequest, MqttRpcServerTransport} from './server_transport';
import {MqttService} from '../../net/mqtt/index';
import {Observable} from 'rxjs/Observable';
import {Subscriber} from 'rxjs/Subscriber';
import {ProcedureCallRequest, google, ProcedureCallResponse} from '../../proto';

export class DummyMqttService {
    observer: Subscriber<[string, Buffer]>|null = null;
    topic: string|null = null;
    
    unsubscribe() {}

    subscribe(topic: string): Observable<[string, Buffer]> {
        return new Observable(observer => {
            this.observer = observer;
            this.topic = topic;

            return () => this.unsubscribe();
        });
    }

    publish(topic: string, payload: string|Buffer) {}
}

describe('MqttRpcServerTransport', () => {
    let injector: Injector;
    let transport: ServerTransport;
    let service: DummyMqttService;

    beforeEach(() => {
        injector = new Injector([
            {
                provide: MqttService,
                useClass: DummyMqttService,
            },
            MqttRpcServerTransport,
            Logger,
            useLoggingAdapter(new ConsoleAdapter()),
        ]);
        
        service = injector.get(MqttService);
        transport = injector.get(MqttRpcServerTransport);
    });

    afterEach(() => injector.dispose())
    
    it('should have been created', () => {
        expect(transport).toBeDefined();
    });
    
    it('should subscribe to RPC topics', () => {
        expect(service.topic).toBe('jsmon/rpc/+/+');
        expect(service.observer).toBeTruthy();
    });
    
    it('should unsubscribe when destroyed', () => {
        const unsubscribe = jest.spyOn(service, 'unsubscribe');

        injector.dispose();
        expect(unsubscribe).toHaveBeenCalled();
    });

    it('should emit a ServerChannel(this) when subscribing to onConnection', () => {
        transport.onConnection
            .subscribe(res => {
                expect(res).toBeTruthy()
                expect(res.onRequest).toBeTruthy();
                expect(res).toBe(transport);
            });
    });
    
    it('should emit requests', () => {
        const onRequest = (transport as MqttRpcServerTransport).onRequest;
        
        const payload = ProcedureCallRequest.encode({
            method: 'Bar',
            requestId: '1',
            clientId: 'my-client',
            headers: {
                'Foo': 'bar',
            },
            payload: google.protobuf.Any.create({
                type_url: 'FooRequest',
                value: new Uint8Array([]),
            }),
        }).finish().toString();
        
        return new Promise((resolve, _) => {
            onRequest.subscribe(request => {
                expect(request).toBeInstanceOf(MqttRequest);
                console.log(request.method);
                expect(request.method).toBe('Bar');
                expect(request.headers.Foo).toBe('bar');
                resolve();
            });
            
            service.observer.next(['jsmon/rpc/Foo/Bar', Buffer.from(payload)]);
        });
    });
    
    it('should publish successful response messages without a reply header', () => {
        const t = transport as MqttRpcServerTransport;
        const spy = jest.spyOn(service, 'publish');

        const request = ProcedureCallRequest.create({
            method: 'Bar',
            requestId: '1',
            clientId: 'my-client',
            headers: {
                'Foo': 'bar',
            },
            payload: google.protobuf.Any.create({
                type_url: 'FooRequest',
                value: new Uint8Array([]),
            }),
        });
        
        const response = google.protobuf.Any.create({
            type_url: 'SomeType',
            value: new Uint8Array([]),
        });

        t._resolve(request, response, {});

        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toBe('jsmon/rpc-reply/my-client/1');
        const res = ProcedureCallResponse.decode(new Uint8Array(spy.mock.calls[0][1]));
        expect(res.clientId).toBe('my-client');
        expect(res.requestId).toBe('1');
        expect(res.error).toBe(false);
        expect(res.payload.type_url).toBe('SomeType')
        expect(res.payload.value.length).toBe(0);
    });

    it('should publish failed response messages without a reply header', () => {
        const t = transport as MqttRpcServerTransport;
        const spy = jest.spyOn(service, 'publish');

        const request = ProcedureCallRequest.create({
            method: 'Bar',
            requestId: '1',
            clientId: 'my-client',
            headers: {
                'Foo': 'bar',
            },
            payload: google.protobuf.Any.create({
                type_url: 'FooRequest',
                value: new Uint8Array([]),
            }),
        });
        
        t._fail(request, "failed", {});

        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toBe('jsmon/rpc-reply/my-client/1');
        const res = ProcedureCallResponse.decode(new Uint8Array(spy.mock.calls[0][1]));
        expect(res.clientId).toBe('my-client');
        expect(res.requestId).toBe('1');
        expect(res.error).toBe(true);
        expect(res.errorMessage).toBe("failed");
    });
});