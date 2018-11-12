import { HttpServerTestBed } from "./testing";
import { Get, Put, Post, Middleware, Use } from "./annotations";
import { Request, Response, Next } from 'restify';
import { Property, Required, Definition } from "./parameters";
import { PreconditionFailedError, InternalError, InternalServerError } from "restify-errors";
import { Injectable } from "@jsmon/core";

@Injectable()
class MyMiddleware implements Middleware {
    handle(options: number, req: Request, res: Response, next: Next) {
        res.send(options);
        next(false);
    }
}

export function Reject(code: number) {
    return function(...args: any[]) {
        return Use(MyMiddleware, code)(...args);
    }
}

@Definition()
class Permission {
    @Property()
    @Required()
    name: string;
}

@Definition()
class UserSettings {
    @Property({regex: /de|at|en/})
    language: string;
}

@Definition()
class User {
    @Property({regex: /[a-zA-Z]{3,}/})
    @Required()
    username: string;

    @Property()
    fullname: string;

    @Property()
    @Required()
    admin: boolean;
    
    @Property({min: 0, max: 100})
    age: number;
    
    @Property()
    settings: UserSettings;
    
    @Property({items: Permission})
    permissions: Permission[]
}

class UserAPI {
    @Get('/byName/:username', {
        parameters: {
            username: 'string'
        }
    })
    @Get('/byNameTest/:username', {
        parameters:  {
            username: {
                type: 'string',
                regex: /[a-z]+/,
            }
        }
    })
    async getUser(req: Request, res: Response, next: Next) {
        res.send(204);
        next();
    }

    @Get('/byId/:id', {
        parameters: {
            id: 'number',
        }
    })
    @Get('/byIdMin/:id', {
        parameters: {
            id: {
                type: 'number',
                min: 10
            }
        }
    })
    @Get('/byIdMax/:id', {
        parameters: {
            id: {
                type: 'number',
                max: 10
            }
        }
    })
    @Get('/byIdMinMax/:id', {
        parameters: {
            id: {
                type: 'number',
                max: 10,
                min: 5,
            }
        }
    })
    async getUserById(req: Request, res: Response, next: Next) {
        res.send(204);
        next();
    }
    
    @Get('/byState/:state', {
        parameters: {
            state: 'boolean'
        }
    })
    async getUserByState(req: Request, res: Response, next: Next) {
        res.send(204);
        next();
    }
    
    @Put('/nobody')
    @Put('/body', {
        body: 'string'
    })
    @Put('/string', {body: {type: 'string', regex: /[a-z]+/}})
    @Put('/number', {body: {type: 'number', min: 0, max: 10}})
    @Put('/boolean', {body: 'boolean'})
    async simpleBodyTest(req: Request, res: Response, next: Next) {
        res.send(204);
        next();
    }
    
    @Post('/create', {
        body: User
    })
    async createUser(req: Request, res: Response, next: Next) {
        res.send(204);
        next();
    }
    
    @Put('/array_string', {
        body: {type: 'array', itemDefinition: {type: 'string', regex: /.{3,}/}}
    })
    @Put('/array_number', {
        body: {type: 'array', itemDefinition: {type: 'number', min: 0, max: 100}}
    })
    @Put('/array_boolean', {
        body: {type: 'array', itemDefinition: {type: 'boolean'}}
    })
    async arrayTest(req: Request, res: Response, next: Next) {
        res.send(204);
        next();
    }
    
    @Get('/middleware')
    @Reject(505)
    async middlewareTest(req: Request, res: Response, next: Next) {
        res.send(204);
        next();
    }
    
    @Get('/middleware_instance')
    @Use(new MyMiddleware, 505)
    async middlewareTest2(req: Request, res: Response, next: Next) {
        res.send(204);
        next();
    }
}

describe('HttpServer', () => {
    let testBed: HttpServerTestBed;
    
    async function expectError(call: Promise<any>, statusCode: number = 400) {
        const err = await call.catch(err => err);
        expect(err).toBeDefined();
        expect(err).toBeInstanceOf(Error);
        expect(err.statusCode).toBe(statusCode);
    }
    
    async function expectNoError(call: Promise<any>) {
        const err = await call.catch(err => err);
        expect(err).not.toBeInstanceOf(Error);
    }

    beforeAll(() => {
        testBed = HttpServerTestBed.create({
            controller: UserAPI,
            providers: [MyMiddleware]
        });
    });
    
    // Make sure we re-enable validation
    beforeEach(() => testBed.server.enableValidation());
    
    afterAll(async () => await testBed.dispose());
    
    describe('middleware', () => {
        it('should be called if specified by type', async () => {
            await expectError(testBed.client.get('/middleware'), 505);
        });
        
        it('should be called if specified by instance', async () => {
            await expectError(testBed.client.get('/middleware_instance'), 505);
        });
    })

    describe(`request validation`, () => {
        it('can be disabled', async () => {
            testBed.server.disableValidation();
            await expectNoError(testBed.client.get('/byName/'));
        });
        
        describe('parameters', () => {
            describe('string', () => {
                it('should fail for empty strings', async () => {
                    await expectError(testBed.client.get('/byName/'));
                });
                
                it('should pass for valid parameters', async () => {
                    await expectNoError(testBed.client.get('/byName/username'));
                });
                
                it('should fail for parameters not matching regexp', async () => {
                    await expectError(testBed.client.get('/byNameTest/0'));
                });
                
                it('should pass if regex is matched', async () => {
                    await expectNoError(testBed.client.get('/byNameTest/foobar'))
                });
            });
            
            describe('number', () => {
                it('should fail for missing parameter', async () => {
                    await expectError(testBed.client.get('/byId/'));
                });

                it('should fail for invalid parameters', async () => {
                    await expectError(testBed.client.get('/byId/foobar'));
                });
                
                it('should fail if lower min', async () => {
                    await expectError(testBed.client.get('/byIdMin/0'));
                });

                it('should fail if above max', async () => {
                    await expectError(testBed.client.get('/byIdMax/20'));
                });
                
                it('should pass for valid numbers', async () => {
                    await expectNoError(testBed.client.get('/byIdMinMax/7'));
                });
            });
            
            describe('boolean', () => {
                it('should fail for missing parameter', async () => {
                    await expectError(testBed.client.get('/byState/'));
                });
                
                it('should fail for invalid booleans', async () => {
                    await expectError(testBed.client.get('/byState/foo'));
                    await expectError(testBed.client.get('/byState/10'));
                    await expectError(testBed.client.get('/byState/10'));
                    await expectError(testBed.client.get('/byState/truthy'));
                });
                
                it('should pass for valid booleans', async () => {
                    let values = [
                        'true', 't', '1',
                        'false', 'f', '0'
                    ];

                    for (let i = 0; i < values.length; i++) {
                        await expectNoError(testBed.client.get(`/byState/${values[i]}`));
                    }
                });
            });
        });

        describe('body', () => {
            it('should fail if no body is expected', async () => {
                await expectError(testBed.client.put('/nobody', {foo: 'bar'}));
            });
            
            it('should fail if a body is expected but not provided', async () => {
                await expectError(testBed.client.put('/body'));
            });
            
            describe('string', () => {
                it('should fail if the regex is not matched', async () => {
                    await expectError(testBed.client.put('/string', 'ABCD'));
                });
                
                it('should pass for valid bodies', async () => {
                    await expectNoError(testBed.client.put('/string', 'foobar'));
                });
            });
            
            describe('number', () => {
                it('should fail for "not-a-number"', async () => {
                    await expectError(testBed.client.put('/number', 'foobar'));
                });
                
                it('should fail for out-of-bounds (lower than min)', async () => {
                    await expectError(testBed.client.put('/number', -1));
                });
                
                it('should fail for out-of-bounds (higher than max)', async () => {
                    await expectError(testBed.client.put('/number', 11));
                });
                
                it('should pass for valid numbers', async () => {
                    await expectNoError(testBed.client.put('/number', 6));
                });
            });
            
            describe('boolean', () => {
                it('should fail for invalid boolean values', async () => {
                    await expectError(testBed.client.put('/boolean', 'foobar'));
                });
                
                it('should pass for valid boolean values', async () => {
                    let values = [
                        'true', 't', '1',
                        'false', 'f', '0'
                    ];

                    for (let i = 0; i < values.length; i++) {
                        await expectNoError(testBed.client.put('/boolean', values[i]));
                    }
                });
            });

            describe('object', () => {
                describe('class definition', () => {
                    it('should fail if required properties are missing', async () => {
                        await expectError(testBed.client.post('/create', {firstname: 'foo'}));
                    });
                    
                    it('should fail if string properties do not satisfy constraints', async () => {
                        await expectError(testBed.client.post('/create', {username: '41', admin: true}));
                    });
                    
                    it('should fail if number properties do not satisfy constraints', async () => {
                        await expectError(testBed.client.post('/create', {username: 'foo', admin: true, age: -1}));
                    });
                    
                    it('should pass if all required properties are correct', async () => {
                        await expectNoError(testBed.client.post('/create', {
                            username: 'foo',
                            admin: false,
                            age: 10,
                        }));
                    });
                    
                    it('should fail if property types are invalid', async () => {
                        await expectError(testBed.client.post('/create', {
                            username: 'foo',
                            admin: false,
                            settings: 'foobar'
                        }));
                    });
                    
                    it('should fail if sub-class-properties are invalid', async () => {
                        await expectError(testBed.client.post('/create', {
                            username: 'foo',
                            admin: false,
                            settings: {
                                language: 'invalid' 
                            }
                        }));
                    });
                    
                    it('should pass if sub-class-properties are valid', async () => {
                        await expectNoError(testBed.client.post('/create', {
                            username: 'foo',
                            admin: false,
                            settings: {
                                language: 'en' 
                            }
                        }));
                    });
                });
            });

            describe('array', () => {
                it('should fail if value is not an array', async () => {
                    await expectError(testBed.client.post('/create', {
                        username: 'foo',
                        admin: false,
                        permissions: 'something'
                    }));
                });
                
                it('should fail if some values does not match array type', async () => {
                    await expectError(testBed.client.post('/create', {
                        username: 'foo',
                        admin: false,
                        permissions: [
                            {name: 'perm1'},
                            {name: 'perm2'},
                            'perm3',
                        ]
                    }));
                });
                
                it('should pass if the array is empty', async () => {
                    await expectNoError(testBed.client.post('/create', {
                        username: 'foo',
                        admin: false,
                        permissions: []
                    }));
                });
                
                it('should pass if all array values are valid', async () => {
                    await expectNoError(testBed.client.post('/create', {
                        username: 'foo',
                        admin: false,
                        permissions: [
                            {name: 'perm1'},
                            {name: 'perm2'},
                        ]
                    }));
                });
                
                it('should fail if one string value does not satisfy constraints', async () => {
                    await expectError(testBed.client.put('/array_string', [
                        'foo',
                        'f',
                        'bar'
                    ]));
                });
                
                it('should fail if one number value does not satisfy constraints', async () => {
                    await expectError(testBed.client.put('/array_number', [
                        6,
                        5,
                        -1
                    ]));
                });
                
                it('should fail if one boolean value does not satisfy constraints', async () => {
                    await expectError(testBed.client.put('/array_boolean', [
                        true,
                        false,
                        10
                    ]));
                });
            });
        });
    });
});