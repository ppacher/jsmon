import {dirname, resolve} from 'path';
import {Injector, Type, Provider} from '@homebot/core';
import {PlatformLoader} from '../loader';

import {Case1Plugin, DummyService, DummyDevice, AnotherService, homebot} from './test-data/case1/entry';

const testDataDir = resolve(dirname(__filename), 'test-data');

function fromTestDir(path: string): string {
    return resolve(testDataDir, path);
}

class MockInjector {
    provide(token: any): void {}
    get(token: any) {}
}

class MockDeviceManager {
    setupDevice(name: string, type: Type<any>, description: string, providers: Provider[]) {

    }
}

describe('PlatformLoader', () => {
    let loader: PlatformLoader; 
    let injector: MockInjector;
    let manager: MockDeviceManager;
   
    beforeEach(() => {
        injector = new MockInjector();
        manager = new MockDeviceManager();

        loader = new PlatformLoader(injector as any, manager as any, [testDataDir]);
    });
   
    describe('package.json parsing', () => {
        it('should return undefined if the package.json file does not exist', () => {
            let result = loader._tryParsePackage(fromTestDir('.'));
            
            expect(result).toBeUndefined();
        });
        
        it('should load the entry file specified in package.json', () => {
            let result = loader._tryParsePackage(fromTestDir('case1'));
            expect(result).toBeDefined();
            expect(Object.keys(result.factories)).toContain('case1');
        });
    });

    describe('plugin resolution', () => {
        it('should automatically find the plugin', async () => {
            let result = await loader.loadModule('case1');
            expect(result).toBeDefined();
            expect(Object.keys(result.factories)).toContain('case1');
            expect(result.path).toBe(fromTestDir('case1'));
        });
        
        it('should throw if the plugin cannot be found', async () => {
            let error = false;
            try {
                let result = await loader.loadModule('does-not-exist')
            } catch( err ) {
                error = true;
            }
            
            expect(error).toBe(true);
        });

        it('should only load a plugin once', async () => {
            let findSpy = jest.spyOn(loader, '_findModule');

            let result = await loader.loadModule('case1');
            expect(result).toBeDefined();
            
            let result2 = await loader.loadModule('case1');
            expect(result).toBe(result2); // Must be the very same object
            
            expect(findSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('plugin bootstrapping', () => {
        it('should bootstrap the plugin', async () => {
            let provideSpy = jest.spyOn(injector, 'provide');
            let getSpy = jest.spyOn(injector, 'get');

            await loader.bootstrapPlugin('case1', Case1Plugin);
            
            expect(provideSpy).toHaveBeenCalledTimes(2);
            expect(provideSpy.mock.calls[0][0]).toEqual([DummyService]);
            expect(provideSpy.mock.calls[1][0]).toEqual(Case1Plugin);
            
            expect(getSpy).toHaveBeenCalledTimes(2);
            expect(getSpy.mock.calls[0][0]).toBe(DummyService);
            expect(getSpy.mock.calls[1][0]).toBe(Case1Plugin);
        });

        it('should only bootstrap a plugin once', async () => {
            await loader.bootstrapPlugin('case1', Case1Plugin);

            let provideSpy = jest.spyOn(injector, 'provide');
            await loader.bootstrapPlugin('case1', Case1Plugin);
            
            expect(provideSpy).not.toHaveBeenCalled()
        });
    });

    describe('platform bootstrapping', () => {
        it('should call the correct factory function and pass parameters', async () => {
            let factory = jest.spyOn(homebot, 'case1');
            let params = {
                param1: 'foobar'
            };

            let spec = await loader.createPlatform('case1', 'case1', params);
            
            expect(spec).toBeDefined();
            expect(factory).toHaveBeenCalledTimes(1);
            expect(factory.mock.calls[0][0]).toBe(params)
        });
        
        it('should support async factory functions', async () => {
            let factory = jest.spyOn(homebot, 'case2');
            let params = {
                param1: 'foobar'
            };

            let spec = await loader.createPlatform('case1', 'case2', params);
            
            expect(spec).toBeDefined();
            expect(factory).toHaveBeenCalledTimes(1);
            expect(factory.mock.calls[0][0]).toBe(params)
        });

        it('should create and register each device and service from the platform spec', async () => {
            let deviceSpy = jest.spyOn(manager, 'setupDevice');

            let result = await loader.bootstrapPlatform('case1', 'case1', {});
            
            expect(result).toBeDefined();
            expect(result.length).toBe(2);
            
            // We cannot spy on MockInjector because a new child injector is created for each service that 
            // is bootstrapped
            expect(result[1]).toBeInstanceOf(AnotherService);
            
            expect(deviceSpy).toHaveBeenCalledTimes(1);
            expect(deviceSpy.mock.calls[0]).toEqual(['dummy', DummyDevice, '', [AnotherService]]);
        })
    });
})