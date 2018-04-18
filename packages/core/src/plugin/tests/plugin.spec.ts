import {Plugin} from '../plugin';
import {bootstrapPlugin} from '../bootstrap';
import { Injector } from '../../di/index';

class P1Service {}

@Plugin({
    providers: [P1Service]
})
class P1 {}

class P2Service {}

@Plugin({
    providers: [P2Service, P2Service],
    exports: [P1]
})
class P2 {}

class MockInjector {
    constructor(public parent?: MockInjector) {

    }
    provide(...args: any[]) {} 
    get(...args: any[]) {}
    createChild(...args: any[]) {return new MockInjector(this);}
    has() {return false;}
}

describe('Plugins', () => {
    describe('when bootstrapped', () => {
        let injector: Injector;
        beforeEach(() => {
            injector = new MockInjector() as any;
        });

        it('should create a new injector', () => {
            let inj = bootstrapPlugin(P1, injector);
            expect((inj as any).parent).toBe(injector);
        });
        
        it('should create a plugin instance', () => {
            let spy;
            let orig = injector.createChild;

            jest.spyOn(injector, 'createChild').mockImplementation(() => {
                let child = orig.bind(injector)([]);
                spy = jest.spyOn(child, 'get');
                
                return child;
            });
            
            bootstrapPlugin(P1, injector);
            
            expect(spy).toHaveBeenCalledWith(P1);
        });
        
        it('should add providers', () => {
            let orig = injector.createChild;

            let spy = jest.spyOn(injector, 'createChild').mockImplementation(() => {
                return orig.bind(injector)([]);
            });let child =
            
            bootstrapPlugin(P1, injector);
            
            expect(spy).toHaveBeenCalledWith([P1, P1Service]);
        });

        it('should resolve exports', () => {
            let orig = injector.createChild;

            let spy = jest.spyOn(injector, 'createChild').mockImplementation(() => {
                return orig.bind(injector)([]);
            });let child =
            
            bootstrapPlugin(P2, injector);
            
            expect(spy).toHaveBeenCalledWith([P2, P2Service, P1, P1Service]);
        });
    });
});