import {DeviceMessage} from '@jsmon/platform/devices/api';
import {ParameterType} from '@jsmon/platform';
import {MqttService, CommandHandler} from '../mqtt.service';
import {MqttDeviceAPI, DiscoveryHandler} from '../device.api';

import {Observable} from 'rxjs/Observable';
import {Subscriber} from 'rxjs/Subscriber';
import {Subscription} from 'rxjs/Subscription';

class MockMqttService {
    subscriptions: Map<string, Subscriber<[string, Buffer]>> = new Map();

    subscribe(topic: string): Observable<[string, Buffer]> {
        return new Observable(observer => {
            this.subscriptions.set(topic, observer);

            return () => {
                this.subscriptions.delete(topic);
            }
        });
    }
    
    publish(topic: string, payload: Buffer|string): void {}
    
    handle(topic: string, handler: CommandHandler): Subscription {
        return null;
    }
    
    call(topic: string, payload: Buffer|string): void {}
}

describe('MqttDeviceAPI', () => {
    let api: MqttDeviceAPI;
    let service: MockMqttService;

    beforeEach(() => {
        service = new MockMqttService();
        api = new MqttDeviceAPI(service as any);
    });

    describe('discovery', () => {
        it('should support sending discovery requests', () => {
            let publishSpy = jest.spyOn(service, 'publish');
            
            api.initiateDiscovery();

            expect(publishSpy).toHaveBeenCalled();
            expect(publishSpy.mock.calls[0][0]).toBe('jsmon/discovery');
            expect(publishSpy.mock.calls[0][1]).toBe(null);
        });
        
        it('should support receiving discovery requests', () => {
            let spy = jest.fn().mockImplementation(() => {
                return Promise.resolve([]);
            })
            
            api.setupDiscoveryHandler(spy);
            
            let sub = service.subscriptions.get('jsmon/discovery');
            expect(sub).toBeDefined();
            
            sub.next(['jsmon/discovery', null]);
            expect(spy).toHaveBeenCalled();
        });

        it('should publish the discovery handler response', () => {
            let dev: DeviceMessage = {
                commands: [],
                name: 'myDevice',
                description: 'some description',
                sensors: [
                    {
                        description: 'sensor1',
                        name: 'sensor1',
                        type: ParameterType.String,
                        value: 'foobar'
                    }
                ],
            };
            
            return new Promise((resolve, reject) => {
                let publishSpy = jest.spyOn(service, 'publish').mockImplementation((topic, payload) => {
                    expect(topic).toBe('jsmon/device/myDevice')
                    expect(JSON.parse(payload)).toEqual(dev);
                    resolve();   
                });
                
                let spy = jest.fn().mockImplementation(() => {
                    return Promise.resolve(dev)
                });
                
                api.setupDiscoveryHandler(spy);

                let sub = service.subscriptions.get('jsmon/discovery');
                sub.next(['jsmon/discovery', null]);
            });
        });
        
        it('should support clearing the discovery handler', () => {
            api.setupDiscoveryHandler(async () => []);
            expect(service.subscriptions.get('jsmon/discovery')).toBeDefined();

            api.setupDiscoveryHandler(null);
            expect(service.subscriptions.get('jsmon/discovery')).toBeUndefined();
        });
    });
    
    describe('sensors', () => {
        it('should support watching sensors', () => {
            return new Promise((resolve, reject) => {
                let subscribeSpy = jest.spyOn(service, 'subscribe');
                let sensorSub = api.watchSensor('mydevice', 'foo')
                    .subscribe(val => {
                        expect(val).toBe(10);
                        resolve();
                    });
                    
                expect(subscribeSpy).toHaveBeenCalled();
                expect(subscribeSpy.mock.calls[0][0]).toBe('jsmon/device/mydevice/sensor/foo/value');

                let sender = service.subscriptions.get('jsmon/device/mydevice/sensor/foo/value');
                expect(sender).toBeDefined();

                sender.next(['jsmon/device/mydevice/sensor/foo/value', new Buffer(JSON.stringify(10))]);
            });
        });
    });
    
    describe('commands', () => {
        it('should support setting abitrary command handlers', () => {
            let spy = jest.fn().mockImplementation(() => {
                return Promise.resolve('success');
            });

            let handleSpy = jest.spyOn(service, 'handle');
            
            let sub = api.setupDeviceCommandHandler('mydevice', 'cmd1', spy);

            expect(handleSpy).toHaveBeenCalledWith('jsmon/device/mydevice/command/cmd1', spy);
        })
    });
})