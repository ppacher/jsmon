import {ReflectiveInjector} from '../src/di/reflective_injector';
import {Provider} from '../src/di/provider';
import {Optional, Injectable, SkipSelf, Self} from '../src/di/annotations';

@Injectable()
export class Foo {

}

@Injectable()
export class Bar {
    constructor(public foo: Foo) {}
}

describe('ReflectiveInjector', () => {
    it('should create a new instance', () => {
        let injector = new ReflectiveInjector();

        injector.addProvider([
            Foo,
            Bar
        ]);
        
        let b: Bar = injector.get(Bar);

        expect(b).toBeDefined();
        expect(b.foo).toBeDefined();
        expect(b.foo instanceof Foo).toBe(true);
    });
    
    it('should bubble by default', () => {
        let parent = new ReflectiveInjector();

        parent.addProvider([
            Foo,
        ]);
        
        let child = new ReflectiveInjector(parent);
        child.addProvider(Bar);

        let b: Bar = child.get(Bar);
        expect(b).toBeDefined(),
        expect(b instanceof Bar).toBe(true);
        expect(b.foo instanceof Foo).toBe(true);
    });

    it('should take SkipSelf visibility annotations into account', () => {
        let parent = new ReflectiveInjector();
        parent.addProvider({
            provide: 'FOO',
            useValue: 'foo',
        });

        let child = new ReflectiveInjector(parent);
        child.addProvider([
            {
                provide: 'FOO',
                useValue: 'bar'
            },
            {
                provide: 'test',
                useFactory: (b) => b,
                debs: [[new SkipSelf(), 'FOO']]
            }
        ]);

        let t = child.get('test');
        expect(t).toBe('foo'); // NOT 'bar'
    });
    
    it('should take Self visibility annotations into account', () => {
        let parent = new ReflectiveInjector();
        parent.addProvider({
            provide: 'FOO',
            useValue: 'foo',
        });

        let child = new ReflectiveInjector(parent);
        child.addProvider([
            {
                provide: 'test',
                useFactory: (b) => b,
                debs: [[new Self(), 'FOO']]
            }
        ]);
        
        let testCase = () => {
            let f = child.get('test');
        };
        
        expect(testCase).toThrowError();
    });

    it('should not throw for missing optional dependecies', () => {
        let parent = new ReflectiveInjector();
        parent.addProvider({
            provide: 'FOO',
            useValue: 'foo',
        });

        let child = new ReflectiveInjector(parent);
        child.addProvider([
            {
                provide: 'test',
                useFactory: (b) => b,
                debs: ['FOO', [new Optional(), 'bar']]
            }
        ]);
        
        let testCase = () => {
            let f = child.get('test');
            expect(f).toBeDefined();
        };
        
        expect(testCase).not.toThrowError();
    });
});