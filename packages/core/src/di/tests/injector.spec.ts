import {
    Injector,
    Injectable,
    ValueProvider,
    ClassProvider,
    ExistingProvider,
    FactoryProvider,
    OnDestroy
} from "../index";

describe(`Injector`, () => {
    let injector: Injector;

    beforeEach(() => {
        injector = new Injector();
    });
    
    it('should create a new instance when requested', () => {
        class A {}
        
        injector.provide(A);

        let a = injector.get(A);

        expect(a).toBeDefined();
        expect(a).toBeInstanceOf(A);
    });
    
    describe('providers', () => {
        it('should support ValueProvider', () => {
            let value = {prop: 'value'};
            
            injector.provide({
                provide: 'MyCustomToken',
                useValue: value
            });

            let obj = injector.get('MyCustomToken');
            expect(obj).toBe(value);
        });
        
        it('should support ClassProvider', () => {
            class A {}
            
            injector.provide({
                provide: 'MyClass',
                useClass: A
            });

            let obj = injector.get('MyClass');
            expect(obj).toBeInstanceOf(A);
        });

        it('should support FactoryProvider', () => {
            let factory = () => 'value';

            injector.provide({
                provide: 'MyToken',
                useFactory: factory,
            });

            let obj = injector.get('MyToken');
            expect(obj).toBe('value');
        });
        
        it('should support ExistingProvider', () => {
            class A {}
            
            injector.provide({
                provide: 'ClassToken',
                useClass: A,
            });
            injector.provide({
                provide: 'MyToken',
                useExisting: 'ClassToken'
            });

            let obj = injector.get('MyToken');
            expect(obj).toBeInstanceOf(A);
        });
    });
    
    describe('dependencies', () => {
        it('should resolve class dependencies', () => {
            class A1 {}
            
            @Injectable()
            class B {
                constructor(public a: A1) {}
            }
            
            injector.provide(A1);
            injector.provide(B);

            let obj: B = injector.get(B);
            expect(obj).toBeInstanceOf(B);
            expect(obj.a).toBeDefined();
            expect(obj.a).toBeInstanceOf(A1);
        });
        
        it('should resolve factory dependencies', () => {
            let dependet = 'foobar';
            let factory = (d: string) => d;

            injector.provide({
                useValue: dependet,
                provide: 'FactoryDependency'
            });
            injector.provide({
                provide: 'factoryDepTest',
                useFactory: factory,
                debs: ['FactoryDependency']
            });

            let value = injector.get('factoryDepTest');
            expect(value).toBe('foobar');
        })
        
        it('should recursively resolve dependencies', () => {
            class A2 {}
            
            @Injectable()
            class B1 {
                constructor(public a2: A2) {}
            }
            
            @Injectable()
            class C1 {
                constructor(public b1: B1){}
            }
            
            injector.provide([A2, B1, C1]);
            
            let obj: C1 = injector.get(C1);
            expect(obj).toBeInstanceOf(C1),
            expect(obj.b1).toBeInstanceOf(B1);
            expect(obj.b1.a2).toBeInstanceOf(A2);
        })
    });
    
    describe('destroyable', () => {
        let destroyed = false;
        class Destroyable implements OnDestroy {
            onDestroy() {
                destroyed = true;
            }
        }
        
        beforeEach(() => {
            destroyed = false;
        });

        it('should invoke onDestroy for each destroyable', () => {
            injector.provide(Destroyable);
            let instance: Destroyable = injector.get(Destroyable);

            expect(destroyed).toBe(false);

            injector.dispose();

            expect(destroyed).toBe(true);
        });

        it('should dispose itself when the parent is disposed', () => {
            let child = new Injector(injector);
            child.provide(Destroyable);

            let instance = child.get(Destroyable);
            
            injector.dispose();
            expect(destroyed).toBe(true);
        });
    })
});