import {Module, ModuleInstance, bootstrapModule} from '../src/module';
import {getRootInjector} from '../src/di';

@Module({})
class Bar {}

@Module({
    imports: [Bar],
})
class Foo {}

describe('bootstrapModule', () => {
    it('should return a ModuleInstance wrapper', () => {
        class A {}
        
        let decorated = Module({})(A);
        let instance = bootstrapModule(decorated);
        
        expect(instance).toBeDefined();
    });
    
    it('should default to the root injector', () => {
        class A {}
        
        let decorated = Module({})(A);
        let instance = bootstrapModule(decorated);
        
        expect(instance).toBeDefined();
        expect(instance.injector).toBeDefined();
        expect(instance.injector.parent).toBe(getRootInjector());
    });
    
    it('should expose the class instance', () => {
        class A {}
        
        let decorated = Module({})(A);
        let instance = bootstrapModule(decorated);
        
        expect(instance).toBeDefined();
        expect(instance.instance).toBeDefined(),
        expect(instance.instance instanceof A).toBe(true);
    });
    
    it('should create instances of imported modules', () => {
        let instance = bootstrapModule(Foo);
        
        expect(instance.imports.find(i => i.instance instanceof Bar)).toBeDefined();
    });
});