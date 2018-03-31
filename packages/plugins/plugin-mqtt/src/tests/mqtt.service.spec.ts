import {Injector, Provider, Logger} from '@homebot/core';
import {MQTT_BROKER_URL, MQTT_CLIENT_CONNECT, MqttConnectFn, MqttService} from '../mqtt.service';

class MockMqttClient {
    registeredEventListeners: Map<string, Function> = new Map();

    on(topic: string, cb: Function) {
        this.registeredEventListeners.set(topic, cb);
    }

    subscribe(topic: string, cb: (err, granted) => void) {

    }
    
    unsubscribe(topic: string) {

    }
    
    publish(topic: string, payload: Buffer) {

    }
    
    fakePublish(topic: string, payload: Buffer): void {
        let cb = this.registeredEventListeners.get('message');
        
        if (!!cb) {
            cb(topic, payload);
        } else {
            throw new Error(`no callback for message event`)
        }
    }
}

describe('MqttService', () => {
    let mockClient: MockMqttClient;
    
    beforeEach(() => {
        mockClient = new MockMqttClient();
    });
    
    describe('connecting', () => {
        it('should have the MQTT broker URL optional', () => {
            let service = new MqttService(undefined, new Logger(undefined), (url) => {
                expect(url).toBeUndefined();
                return new MockMqttClient() as any;
            })
        });
        
        it('should use the MQTT broker URL if provided', () => {
            let service = new MqttService('my-url', new Logger(undefined), (url) => {
                expect(url).toBe('my-url');
                return new MockMqttClient() as any;
            })
        });
        
        it('should setup listeners for `connect` and `message`', () => {
            let service = new MqttService(undefined, new Logger(undefined), () => mockClient as any);
            expect(mockClient.registeredEventListeners.get('connect')).toBeDefined();
            expect(mockClient.registeredEventListeners.get('message')).toBeDefined();
        });
    });

    describe('publish and subscribe', () => {
        let service: MqttService;

        beforeEach(() => {
            service = new MqttService(undefined, new Logger(undefined), () => mockClient as any);
        });
        
        it('should not subscribe until the observable is subscribed', () => {
            let spy = jest.spyOn(mockClient, 'subscribe');
            let unsubscribe = jest.spyOn(mockClient, 'unsubscribe');

            let obs = service.subscribe('foo/bar');

            expect(spy).not.toHaveBeenCalled();
            
            let sub = obs.subscribe();
            
            expect(spy).toHaveBeenCalled();
            expect(spy.mock.calls[0][0]).toBe('foo/bar');
            expect(spy.mock.calls[0][1]).toBeDefined();
            
            expect(unsubscribe).not.toHaveBeenCalled();
            sub.unsubscribe();
            expect(unsubscribe).toHaveBeenCalledWith('foo/bar');
        });
        
        it('should only emit messages that match the specified topic', () => {
            let observer = jest.fn();

            let obs = service.subscribe('foo/bar')
                .subscribe(([topic, buffer]) => observer(topic, buffer));
            
            let payload = new Buffer('test');
            mockClient.fakePublish('foo/bar', payload);
            
            expect(observer).toHaveBeenCalledWith('foo/bar', payload);
            
            mockClient.fakePublish('foo/bar/baz', payload);
            expect(observer).not.toHaveBeenCalledTimes(2);
            
            obs.unsubscribe();
        });
        
        it('should support mutliple subscribers for the same topic', () => {
            let subscribeSpy = jest.spyOn(mockClient, 'subscribe');
            let unsubscribeSpy = jest.spyOn(mockClient, 'unsubscribe');

            let sub1 = service.subscribe('foo/bar').subscribe();
            let sub2 = service.subscribe('foo/bar').subscribe();
            
            // it should only subscribe to the topic once
            expect(subscribeSpy).toHaveBeenCalledTimes(1);
            expect(unsubscribeSpy).not.toHaveBeenCalled();
            
            sub1.unsubscribe();
            expect(unsubscribeSpy).not.toHaveBeenCalled();

            sub2.unsubscribe(),
            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
        });

        it('should forward publish calls to the mqtt client', () => {
            let publishSpy = jest.spyOn(mockClient, 'publish');

            service.publish('foo/bar', 'payload');

            expect(publishSpy).toHaveBeenCalledWith('foo/bar', 'payload');
        });
    });
});