import { Put } from './annotations';
import { DefinitionResolver } from './parameter-internals';
import { Foo, User } from './parameter.spec';
import { getAnnotations } from './server';

export class TestAPI {
    @Put('/:string/:number/:boolean', {
        parameters: {
            string: {
                type: 'string',
                regex: /.*/,
            },
            number: {
                type: 'number',
                min: 0,
                max: 100,
            },
            boolean: 'boolean',
        },
        body: User
    })
    async put() {}
}

describe('RequestDefinition', () => {
    it('should correctly parse request definition', () => {
        const resolver = new DefinitionResolver();
        const settings = getAnnotations(TestAPI, resolver);
        
        expect(settings.length).toBe(1);

        expect(settings[0]).toEqual({
            method: 'put',
            route: '/:string/:number/:boolean',
            definition: {
                body: User,
                parameters: {
                    string: {
                        type: 'string',
                        regex: /.*/
                    },
                    number: {
                        type: 'number',
                        min: 0,
                        max: 100
                    },
                    boolean: 'boolean'
                }
            },
            propertyKey: 'put',
            middleware: [],
            parameters: {
                string: {
                    type: 'string',
                    regex: /.*/
                },
                number: {
                    type: 'number',
                    min: 0,
                    max: 100
                },
                boolean: {
                    type: 'boolean'
                }
            },
            body: {
                classType: User,
                name: 'User',
                description: 'The user object',
                type: 'object',
                properties: {
                    array: {
                        description: 'Multiple fooish properties',
                        itemDefinition: {
                            ref: 'Foo'
                        },
                        items: Foo,
                        type: 'array'
                    },
                    firstname: {
                        type: 'string',
                        description: 'The first name of the user'
                    },
                    foo: {
                        ref: 'Foo'
                    },
                    foo2: {
                        ref: 'Foo'
                    },
                    lastname: {
                        type: 'string',
                        description: 'the last name of the user'
                    },
                    username: {
                        type: 'string',
                        description: 'The name of the user'
                    }
                },
                required: [
                    'username',
                    'foo'
                ]
            }
        })
    });
});