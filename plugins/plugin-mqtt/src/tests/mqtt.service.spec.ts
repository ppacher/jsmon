import {Logger} from '@homebot/platform';
import {
    MqttConnectFn,
    MqttService,
    ProcedureCall
} from '../mqtt.service';

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
    
    describe('remote procedure calls', () => {
        let service: MqttService;

        beforeEach(() => {
            service = new MqttService(undefined, new Logger(undefined), () => mockClient as any);
        });
        
        it('should support RPC handlers', () => {
            let handler = jest.fn().mockImplementation(() => {
                return Promise.resolve('success');
            });
            
            let sub = service.handle('foo/bar', handler);

            let body = new Buffer('my body');

            let payload: ProcedureCall = {
                responseTopic: 'response',
                body: body,
            };
            
            mockClient.fakePublish('foo/bar', new Buffer(JSON.stringify(payload)));

            expect(handler).toHaveBeenCalledWith(body);
        });
        
        it('should send the response to the response topic', () => {
            return new Promise((resolve, reject) => {
                let handler = jest.fn().mockImplementation(() => {
                    return Promise.resolve('success');
                });
                let publishSpy = jest.spyOn(mockClient, 'publish')
                    .mockImplementation((topic, payload) => {
                        expect(topic).toBe('response');
                        expect(payload.toString()).toBe('success');
                        resolve();          
                    });
                
                let sub = service.handle('foo/bar', handler);

                let body = new Buffer('my body');

                let payload: ProcedureCall = {
                    responseTopic: 'response',
                    body: body,
                };
                
                mockClient.fakePublish('foo/bar', new Buffer(JSON.stringify(payload)));
            });
        });
        
        it('should catch errors and publish an error response', () => {
            return new Promise((resolve, reject) => {
                let handler = jest.fn().mockImplementation(() => {
                    return Promise.reject('some error');
                });
                let publishSpy = jest.spyOn(mockClient, 'publish')
                    .mockImplementation((topic, payload) => {
                        expect(topic).toBe('response');
                        expect(JSON.parse(payload.toString())).toEqual({
                            error: 'some error'
                        })
                        resolve();          
                    });
                
                let sub = service.handle('foo/bar', handler);

                let body = new Buffer('my body');

                let payload: ProcedureCall = {
                    responseTopic: 'response',
                    body: body,
                };
                
                mockClient.fakePublish('foo/bar', new Buffer(JSON.stringify(payload)));
            });
        });

        it('should publish RPC correctly', () => {
            let publishSpy = jest.spyOn(mockClient, 'publish');
            
            service.call('foo/bar', 'payload').subscribe().unsubscribe();
            
            expect(publishSpy).toHaveBeenCalled();
            expect(publishSpy.mock.calls[0][0]).toBe('foo/bar');
            
            let payload: ProcedureCall = JSON.parse(publishSpy.mock.calls[0][1]);
            expect(payload.responseTopic).toBeDefined();
            expect(payload.body).toBe('payload');
        });
        
        it('should subscribe for the result', () => {
            let publishSpy = jest.spyOn(mockClient, 'publish');
            let subscribeSpy = jest.spyOn(mockClient, 'subscribe');
            
            service.call('foo/bar', 'payload').subscribe().unsubscribe();
            
            let payload: ProcedureCall = JSON.parse(publishSpy.mock.calls[0][1]);
            
            expect(subscribeSpy).toHaveBeenCalled();
            expect(subscribeSpy.mock.calls[0][0]).toBe(payload.responseTopic);
        });
        
        it('should wait for and emit the result', () => {
            return new Promise((resolve, reject) => {
                let publishSpy = jest.spyOn(mockClient, 'publish');
                
                let res = new Buffer('foobar') ;
                
                let observer = jest.fn().mockImplementation((response) => {
                    expect(response).toBe(res);
                    resolve();   
                });
                
                service.call('foo/bar', 'payload').subscribe(res => observer(res));
                
                expect(publishSpy).toHaveBeenCalled();
                let payload: ProcedureCall = JSON.parse(publishSpy.mock.calls[0][1]);
                
                mockClient.fakePublish(payload.responseTopic, res)
            });
        });
        
        it('should support timeouts', () => {
            return new Promise((resolve, reject) => {
                let publishSpy = jest.spyOn(mockClient, 'publish');
                
                let res = new Buffer('foobar') ;
                
                let observer = jest.fn().mockImplementation((response) => {
                    expect(response).toBeInstanceOf(Error);
                    expect((response as Error).message).toBe('Timeout');
                    resolve();   
                });
                
                service.call('foo/bar', 'payload', 1).subscribe(() => {}, err => observer(err));
                
                expect(publishSpy).toHaveBeenCalled();
                let payload: ProcedureCall = JSON.parse(publishSpy.mock.calls[0][1]);
            });
        });
    });
});