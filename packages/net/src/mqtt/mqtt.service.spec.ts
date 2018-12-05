import { Logger } from '@jsmon/core/log';
import { Topic, getTopicHandlers } from './decorators';
import { MqttService } from './mqtt.service';
import { Injector, Inject } from '@jsmon/core';

class MockMqttClient {
    registeredEventListeners: Map<string, Function> = new Map();

    on(topic: string, cb: Function) {
        this.registeredEventListeners.set(topic, cb);
    }

    subscribe(topic: string, cb: (err, granted) => void) {}
    unsubscribe(topic: string) {}
    publish(topic: string, payload: Buffer) {}
    
    fakePublish(topic: string, payload: Buffer): void {
        let cb = this.registeredEventListeners.get('message');
        
        if (!!cb) {
            cb(topic, payload);
        } else {
            throw new Error(`no callback for message event`)
        }
    }
}



export class MqttDecoratorTest {
    @Topic('test')
    async handler(topic: string, buffer: Buffer) {

    }
}

describe('MqttService', () => {
    let mockClient: MockMqttClient;
    
    beforeEach(() => {
        mockClient = new MockMqttClient();
    });
    
    describe('connecting', () => {
        it('should have the MQTT broker URL optional', () => {
            let service = new MqttService(undefined, new Logger(undefined), undefined, (url: any) => {
                expect(url).toBeUndefined();
                return new MockMqttClient() as any;
            })
        });
        
        it('should use the MQTT broker URL if provided', () => {
            let service = new MqttService('my-url', new Logger(undefined), undefined,  (url) => {
                expect(url).toBe('my-url');
                return new MockMqttClient() as any;
            })
        });
        
        it('should setup listeners for `connect` and `message`', () => {
            let service = new MqttService(undefined, new Logger(undefined), undefined, () => mockClient as any);
            expect(mockClient.registeredEventListeners.get('connect')).toBeDefined();
            expect(mockClient.registeredEventListeners.get('message')).toBeDefined();
        });
    });
    
    describe('publish and subscribe', () => {
        let injector: Injector;
        let service: MqttService;

        beforeEach(() => {
            injector = new Injector([MqttDecoratorTest]);
            service = new MqttService(undefined, new Logger(undefined), injector, () => mockClient as any);
        });
    
        describe('decorators', () => {
            it('decorated method should be subscribed on mount', async () => {
                let spy = jest.spyOn(mockClient, 'subscribe');

                let instance = service.mount(new MqttDecoratorTest());

                expect(spy).toHaveBeenCalled();
                expect(spy.mock.calls[0][0]).toBe('test');
                
                expect(service.isMounted(instance)).toBeTruthy();
            });
            
            it('should support creating the instance using dependecy injection', async () => {
                let spy = jest.spyOn(mockClient, 'subscribe');
                let instance = service.mount(MqttDecoratorTest);
                
                expect(instance).toBeInstanceOf(MqttDecoratorTest);
                expect(spy).toHaveBeenCalled();
                expect(spy.mock.calls[0][0]).toBe('test');
                
                expect(service.isMounted(instance)).toBeTruthy();
            });
            
            it('should support using a custom injector', async () => {
                let spy = jest.fn().mockImplementation((type: any) => {
                    return new MqttDecoratorTest();
                });
                let instance = service.mount(MqttDecoratorTest, {get: spy} as any);
                
                expect(instance).toBeInstanceOf(MqttDecoratorTest);
                expect(spy).toHaveBeenCalled();
                expect(spy.mock.calls[0][0]).toBe(MqttDecoratorTest);
            })

            it('should clean up all subscriptions on unmount', async () => {
                let spy = jest.spyOn(mockClient, 'unsubscribe');

                let instance = service.mount(new MqttDecoratorTest());
                
                expect(service.isMounted(instance)).toBeTruthy();
                
                
                service.unmount(instance);

                expect(spy).toHaveBeenCalled();
                expect(spy.mock.calls[0][0]).toBe('test');
            });
            
            it('should correctly invoke the mounted methods', async () => {
                const instance = new MqttDecoratorTest();
                const spy = jest.spyOn(instance, 'handler');

                service.mount(instance);
                let payload = new Buffer('payload');
                mockClient.fakePublish('test', payload);

                expect(spy).toHaveBeenCalled();
                expect(spy.mock.calls[0][0]).toBe('test');
                expect(spy.mock.calls[0][1]).toBe(payload);
                expect(spy.mock.calls[0][2]).toBe(service);
            });
        })
        
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
            
            let payload = Buffer.from('test');
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