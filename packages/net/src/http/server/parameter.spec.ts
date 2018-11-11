import { forwardRef } from '@jsmon/core';
import { DefinitionResolver } from './parameter-internals';
import { Definition, Property, Required } from './parameters';

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

@Definition()
export class User {
    @Required()
    @Property()
    username: string;
    
    @Property()
    firstname: string;

    @Property('string')
    lastname: string;
    
    @Required()
    @Property()
    foo: Foo;
    
    @Property({items: Foo})
    array: Foo[];
    
    @Property(forwardRef(() => Foo))
    foo2: Foo;
}

describe('Parameters', () => {
    it('should return something', () => {
        DefinitionResolver.resolve(User);

        DefinitionResolver.dump();
    });
})