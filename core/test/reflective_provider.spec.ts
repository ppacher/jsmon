import {
    _getClassDependecies,
    _parseDependecies,
    _zipParametersAndAnnotations,
    resolveReflectiveFactory,
    ReflectiveDependency,
    ResolvedReflectiveFactory,
    ResolvedReflectiveProvider,
    _normalizeProvider
} from '../src/di/reflective_provider';

import {Injectable, SkipSelf, Self, Inject, Optional} from '../src/di/annotations';

@Injectable()
export class Bar {

}

@Injectable()
export class TestWithParameters {
    constructor(public bar: Bar) {}
}

@Injectable()
export class TestWithVisibilityAndOptional {
    constructor(@Optional() private bar: Bar,
                @Self() private _foo: TestWithParameters) {}
}

@Injectable()
export class TestWithInject {
    constructor(@Inject(TestWithParameters) private _withParams: any) {}
}

@Injectable()
export class TestWithoutParameters {
    constructor() {}
}

@Injectable()
export class TestWithoutCtor {}
        
describe('resolveReflectiveFactory', () => {
    it('should resolve dependencies from ClassProvider', () => {
        const factory = resolveReflectiveFactory({
            provide: TestWithParameters,
            useClass: TestWithParameters,
        } as any) ;

        expect(factory).toBeDefined();
        expect(factory.dependencies.length).toBe(1);
        expect(factory.dependencies[0].key.name).toBe('Bar');
        expect(factory.dependencies[0].optional).toBe(false);
        expect(factory.dependencies[0].visibility).toBe(null);

        let instance = factory.factory(new Bar());
        expect(instance).toBeDefined();
        expect(instance instanceof TestWithParameters).toBe(true);
    });
    
    it('should resolve factory for class without dependencies', () => {
        const factory = resolveReflectiveFactory(_normalizeProvider(TestWithoutParameters));

        expect(factory).toBeDefined();
        expect(factory.dependencies.length).toBe(0);
    });
    
    it('should resolve factory for class without constructor', () => {
        const factory = resolveReflectiveFactory({
            provide: TestWithoutCtor,
            useClass: TestWithoutCtor
        } as any);

        expect(factory).toBeDefined();
        expect(factory.dependencies.length).toBe(0);
    });
    
    it('should extract visibility and optional annotations from ClassProvider', () => {
        const factory = resolveReflectiveFactory({
            provide: TestWithVisibilityAndOptional,
            useClass: TestWithVisibilityAndOptional,
        } as any);
        
        expect(factory).toBeDefined();
        expect(factory.dependencies.length).toBe(2);
        
        const bar = factory.dependencies[0];
        const foo = factory.dependencies[1];

        expect(bar.key.name).toBe('Bar');
        expect(bar.optional).toBe(true);
        expect(bar.visibility).toBe(null);
        
        expect(foo.key.name).toBe('TestWithParameters');
        expect(foo.optional).toBe(false);
        expect(foo.visibility instanceof Self).toBe(true);
    });
    
    it('should support ValueProvider', () => {
        const factory = resolveReflectiveFactory(_normalizeProvider({
            provide: 'foobar',
            useValue: 'foo'
        }));
        
        expect(factory).toBeDefined();
        expect(factory.dependencies.length).toBe(0);
        expect(factory.factory()).toBe('foo');
    });
    
    it('should support FactoryProvider without dependencies', () => {
        const factory = resolveReflectiveFactory({
            provide: 'foobar',
            useFactory: () => 'bar',
        } as any);

        expect(factory).toBeDefined();
        expect(factory.dependencies.length).toBe(0);
        expect(factory.factory()).toBe('bar');
    });
    
    it('should support FactoryProvider with dependencies', () => {
        const factory = resolveReflectiveFactory({
            provide: 'foobar',
            useFactory: (a: Bar) => 'bar',
            debs: [Bar],
        } as any);

        expect(factory).toBeDefined();
        expect(factory.dependencies.length).toBe(1);
        expect(factory.dependencies[0].key.name).toBe('Bar');
        expect(factory.dependencies[0].optional).toBe(false);
        expect(factory.dependencies[0].visibility).toBe(null);
        expect(factory.factory()).toBe('bar');
    });
    
    it('should support FactoryProvider with dependecies and annotations', () => {
        const factory = resolveReflectiveFactory({
            provide: 'foobar',
            useFactory: (a: Bar) => 'bar',
            debs: [Bar, [new Optional(), new SkipSelf(), TestWithParameters]],
        } as any);

        expect(factory).toBeDefined();
        expect(factory.dependencies.length).toBe(2);
        // Bar dependency  
        expect(factory.dependencies[0].key.name).toBe('Bar');
        expect(factory.dependencies[0].optional).toBe(false);
        expect(factory.dependencies[0].visibility).toBe(null);
        
        // @Optional() @SkipSelf() TestWithParameters dependency
        expect(factory.dependencies[1].key.name).toBe('TestWithParameters');
        expect(factory.dependencies[1].optional).toBe(true);
        expect(factory.dependencies[1].visibility instanceof SkipSelf).toBe(true);
        expect(factory.factory()).toBe('bar');
    });
    
    it('should support @Inject() for FactoryProviders', () => {
        const factory = resolveReflectiveFactory({
            provide: 'foobar',
            useFactory: (a: Bar) => 'bar',
            debs: [[new Inject('FOO'), TestWithParameters]],
        } as any);
        
        expect(factory).toBeDefined();
        expect(factory.dependencies.length).toBe(1),
        expect(factory.dependencies[0].key.name).toBe('FOO');
    });
    
    it('should support @Inject for ClassProviders', () => {
        let factory = resolveReflectiveFactory({
            provide: TestWithInject,
            useClass: TestWithInject,
        } as any);

        expect(factory).toBeDefined();
        expect(factory.dependencies.length).toBe(1),
        expect(factory.dependencies[0].key.name).toBe('TestWithParameters');
        expect(factory.dependencies[0].optional).toBe(false);
        expect(factory.dependencies[0].visibility).toBe(null);
    });
    
    it('should throw an error with @SkipSelf and @Self', () => {
        const test = () => {
            return resolveReflectiveFactory({
                provide: 'foobar',
                useFactory: (a: Bar) => 'bar',
                debs: [[new Self(), new SkipSelf(), TestWithParameters]],
            } as any);
        }

        expect(test).toThrowError();
    });
})