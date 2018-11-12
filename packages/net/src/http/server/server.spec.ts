import { HttpServerTestBed } from "./testing";
import { Get } from "./annotations";
import { Request, Response, Next } from 'restify';
import { BadRequestError } from "restify-errors";
import { get } from "https";

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
        });
    });
    
    afterAll(async () => await testBed.dispose());

    describe(`request validation`, () => {
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
        })
    });
});