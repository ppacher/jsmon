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
    
    it('should create a new instance when requested', () => {
        class A {}
        
        injector = new Injector(A);

        let a = injector.get(A);

        expect(a).toBeDefined();
        expect(a).toBeInstanceOf(A);
    });
    
    describe('providers', () => {
        it('should support ValueProvider', () => {
            let value = {prop: 'value'};
            
            injector = new Injector({
                provide: 'MyCustomToken',
                useValue: value
            });

            let obj = injector.get('MyCustomToken');
            expect(obj).toBe(value);
        });
        
        it('should support ClassProvider', () => {
            class A {}
            
            injector = new Injector({
                provide: 'MyClass',
                useClass: A
            });

            let obj = injector.get('MyClass');
            expect(obj).toBeInstanceOf(A);
        });

        it('should support FactoryProvider', () => {
            let factory = () => 'value';

            injector = new Injector({
                provide: 'MyToken',
                useFactory: factory,
            });

            let obj = injector.get('MyToken');
            expect(obj).toBe('value');
        });
        
        it('should support ExistingProvider', () => {
            class A {}
            
            injector = new Injector([
                {
                    provide: 'ClassToken',
                    useClass: A,
                },
                {
                    provide: 'MyToken',
                    useExisting: 'ClassToken'
                }
            ]);

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
            
            injector = new Injector([A1, B]);

            let obj: B = injector.get(B);
            expect(obj).toBeInstanceOf(B);
            expect(obj.a).toBeDefined();
            expect(obj.a).toBeInstanceOf(A1);
        });
        
        it('should resolve factory dependencies', () => {
            let dependet = 'foobar';
            let factory = (d: string) => d;
            
            injector = new Injector([
                {
                    useValue: dependet,
                    provide: 'FactoryDependency'
                },
                {
                    provide: 'factoryDepTest',
                    useFactory: factory,
                    debs: ['FactoryDependency']
                }
            ])


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
            
            injector = new Injector([A2, B1, C1]);
            
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
            injector = new Injector(Destroyable);
            let instance: Destroyable = injector.get(Destroyable);

            expect(destroyed).toBe(false);

            injector.dispose();

            expect(destroyed).toBe(true);
        });

        it('should dispose itself when the parent is disposed', () => {
            let parent = new Injector([]);
            let child = new Injector(Destroyable, parent);

            let instance = child.get(Destroyable);
            
            parent.dispose();
            expect(destroyed).toBe(true);
        });
    });

    describe('multi provider', () => {
        it('should support multi providers', () => {
            injector = new Injector([
                {
                    provide: 'test',
                    multi: true,
                    useValue: '1',
                },
                {
                    provide: 'test',
                    multi: true,
                    useValue: '2',
                },
                {
                    provide: 'test',
                    multi: true,
                    useValue: '3',
                },
            ]);
            
            let values: string[] = injector.get('test');

            expect(Array.isArray(values)).toBe(true);
            expect(values.length).toBe(3);
            expect(values).toEqual(['1', '2', '3']);
        });
        
        it('should support multi providers with parent injectors', () => {
            injector = new Injector([
                {
                    provide: 'test',
                    multi: true,
                    useValue: '1'
                }
            ]);
            
            let child = injector.createChild([
                {
                    provide: 'test',
                    multi: true,
                    useValue: '2',
                }
            ]);

            let values: string[] = child.get('test');

            expect(Array.isArray(values)).toBe(true);
            expect(values.length).toBe(2);
            expect(values).toEqual(['2', '1']);
        });
    });
});