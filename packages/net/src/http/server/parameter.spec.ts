import { forwardRef } from '@jsmon/core';
import { DefinitionResolver } from './parameter-internals';
import { Definition, Property, Required, ResolvedObjectProperty } from './parameters';

@Definition()
export class Bar {
    @Property()
    id: number;
}

@Definition()
export class Foo {
    @Property({items: Bar})
    items?: Bar[];
}

@Definition('The user object')
export class User {
    @Required()
    @Property({description: 'The name of the user'})
    username: string;
    
    @Property({description: 'The first name of the user'})
    firstname: string;

    @Property('string', {description: 'the last name of the user'})
    lastname: string;
    
    @Required()
    @Property({description: 'Some fooish property'})
    foo: Foo;
    
    @Property({items: Foo, description: 'Multiple fooish properties'})
    array: Foo[];
    
    @Property(forwardRef(() => Foo))
    foo2: Foo;
}

describe('Parameters', () => {
    let resolver: DefinitionResolver;

    beforeEach(() => {
        resolver = new DefinitionResolver();
    })
    
    it('should correctly parse the obect', () => {
        let user: ResolvedObjectProperty = resolver.resolve(User) as ResolvedObjectProperty;
        
        expect(user).toBeDefined();
        expect(user.type).toBe('object');
        expect(user.description).toBe('The user object');
        expect(user.required.length).toBe(2);
        expect(user.required).toContain('username');
        expect(user.required).toContain('foo');
        
        expect(user.properties.username).toBeDefined();
        expect((user.properties.username as any).type).toBe('string');
        expect((user.properties.username as any).description).toBe('The name of the user');
        
        expect(user.properties.foo).toBeDefined();
        expect((user.properties.foo as any).ref).toBe('Foo');
        
        expect(user.properties.array).toBeDefined();
        expect((user.properties.array as any).type).toBe('array');
        expect((user.properties.array as any).itemDefinition.ref).toBe('Foo');

        // check other types have been parsed as well
        expect(resolver.get(Foo)).toBeDefined();
        expect(resolver.get('Foo')).toBeDefined();
        expect(resolver.get(Bar)).toBeDefined();
    });
})