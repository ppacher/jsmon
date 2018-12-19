import { HttpServerTestBed } from '@jsmon/net/http/server/testing';
import { ResourceServer } from './server';
import { Schema, Resource } from '../schema';
import { LiveCycleManager, ResourceInstance } from '../resources';

const UserSchema: Schema = {
    apiVersion: 'v1',
    kind: 'User',
    specDefinition: {
        type: 'object',
        required: [
            'username'
        ],
        properties: {
            firstname: {type: 'string'},
            lastname: {type: 'string'},
            username: {type: 'string'},
        } 
    }
}

describe('ResourceServer', () => {
    let testBed: HttpServerTestBed;
    let server: ResourceServer;
    let manager: LiveCycleManager;
    
    beforeEach(() => {
        testBed = HttpServerTestBed.create({
            controller: ResourceServer,
            providers: [
                LiveCycleManager
            ],
        });
        
        testBed.server.withBodyParser({})
                      .withQueryParser({});
        
        server = testBed.injector.get(ResourceServer);
        manager = testBed.injector.get(LiveCycleManager);
        
        manager.schemas.add(UserSchema);
    });
    
    describe('schemas', () => {
        it('should be possible to list schemas', async () => {
            const schemas = await testBed.client.get<{[apiVersion: string]: Schema[]}>('/schemas');
            expect(schemas).toBeDefined();
            expect(typeof schemas).toBe('object');
            expect(schemas['v1']).toContainEqual(UserSchema);
        })

        it('should be possible to list schemas of a specific version', async () => {
            const schemas = await testBed.client.get<Schema[]>('/schemas/v1');
            expect(schemas).toBeDefined();
            expect(schemas.length).toBe(1);
            expect(schemas).toContainEqual(UserSchema);
        });
        
        it('should be possble to get the schema of a specific version and kind', async () => {
            const schema = await testBed.client.get<Schema>('/schemas/v1/User');
            expect(schema).toBeDefined();
            expect(schema).toEqual(UserSchema);
        })
        
        it ('should return 404 if the kind does not exist', async () => {
            let err = await testBed.client.get<Schema>('/schemas/v1/Foobar').catch(err => err);

            expect(err).toBeInstanceOf(Error);
            expect(err.statusCode).toBe(404);
            
            err = await testBed.client.get<Schema>('/schemas/v2/User').catch(err => err);

            expect(err).toBeInstanceOf(Error);
            expect(err.statusCode).toBe(404);
        });
        
        it('should create a new schema', async () => {
            const Role: Schema = {
                apiVersion: 'v1',
                kind: 'Role',
                specDefinition: {
                    type: 'object',
                    required: [
                        'name'
                    ],
                    properties: {
                        name: { type: 'string' },
                    }
                }
            } 
            
            await testBed.client.post<void>('/schemas', Role);
            expect(manager.schemas.has('v1', 'Role')).toBeTruthy();
        });
        
        it('should validate the schema properties', async () => {
            let err = await testBed.client.post<void>('/schemas', {}).catch(err => err);
            expect(err).toBeDefined();
            expect(err.statusCode).toBe(400);
            
            err = await testBed.client.post<void>('/schemas', {apiVersion: 'v1'}).catch(err => err);
            expect(err).toBeDefined();
            expect(err.statusCode).toBe(400);
            
            err = await testBed.client.post<void>('/schemas', {apiVersion: 'v1', kind: 'Test'}).catch(err => err);
            expect(err).toBeDefined();
            expect(err.statusCode).toBe(400);
            
            err = await testBed.client.post<void>('/schemas', {apiVersion: 'v1', kind: 'Test', specDefinition: {}});
            expect(err).toBeUndefined();
        });
        
        it('should delete an existing schema', async () => {
            expect(manager.schemas.has('v1', 'User')).toBeTruthy();
            await testBed.client.delete('/schemas/v1/User');
            expect(manager.schemas.has('v1', 'User')).toBeFalsy();
        });

        it('should return 404 when deleting an non-existing schema', async () => {
            const err = await testBed.client.delete('/schemas/v1/Foobar').catch(err => err);
            expect(err).toBeInstanceOf(Error);
            expect(err.statusCode).toBe(404);
        });
    });
    
    describe('resources', () => {
        describe('creating', () => {
            it('should work', async () => {
                const user: Resource<any> = {
                    apiVersion: 'v1',
                    kind: 'User',
                    spec: {
                        username: 'admin'
                    }
                };

                const id = await testBed.client.post<string>('/resources', user);
                expect(id).toBeDefined();
                expect(typeof id).toBe('string');
                
                expect(manager.getResourceById(id)).toBeDefined();
            });
            
            it('should validate the resource and return 400', async () => {
                const err = await testBed.client.post<string>('/resources', {
                    apiVersion: 'v1',
                    kind: 'User',
                    spec: {
                        something: 'test'
                    }
                }).catch(err => err);

                expect(err).toBeInstanceOf(Error)
                expect(err.statusCode).toBe(400);
            });
            
            it('should check for the schema and return 404', async () => {
                const err = await testBed.client.post<string>('/resources', {
                    apiVersion: 'v1',
                    kind: 'Foo',
                    spec: {
                        something: 'test'
                    }
                }).catch(err => err);

                expect(err).toBeInstanceOf(Error)
                expect(err.statusCode).toBe(404);
            });
            
            it('should lock the resource', async () => {
                const user: Resource<any> = {
                    apiVersion: 'v1',
                    kind: 'User',
                    spec: {
                        username: 'admin'
                    }
                };

                const id = await testBed.client.post<string>('/resources', user);
                
                expect(manager.schemas.isLocked('v1', 'User')).toBeTruthy();
            })
        });
        
        describe('deleting', () => {
            let id: string;

            beforeEach(() => {
                id = manager.create({
                    apiVersion: 'v1',
                    kind: 'User',
                    spec: {
                        username: 'admin'
                    }
                });
            });
            
            it('should work', async () => {
                await testBed.client.delete(`/resource/${id}`);
                expect(manager.findOne({
                    apiVersion: 'v1',
                    kind: 'User',
                    spec: {
                        username: 'admin'
                    }
                })).toBeNull()
            });
            
            it('should return 404 for unknown resources', async () => {
                const err = await testBed.client.delete('/resource/someid').catch(err => err);
                expect(err).toBeDefined(),
                expect(err.statusCode).toBe(404);
            });
            
            it('should unlock a resource', async () => {
                expect(manager.schemas.isLocked('v1', 'User')).toBeTruthy();
                await testBed.client.delete(`/resource/${id}`);
                expect(manager.schemas.isLocked('v1', 'User')).toBeFalsy();
            });
        });

        describe('retrieving', () => {
            let id: string;

            beforeEach(() => {
                id = manager.create({
                    apiVersion: 'v1',
                    kind: 'User',
                    spec: {
                        username: 'admin'
                    }
                });
            });

            it('should be possible to list all resources', async () => {
                const res = await testBed.client.get<ResourceInstance<any>[]>('/resources');
                
                expect(res).toBeDefined();
                expect(res.length).toBe(1);
                expect(res[0].id).toBe(id);
            });
            
            it('should be possible to list all resources of a specific apiVersion', async () => {
                const res = await testBed.client.get<ResourceInstance<any>[]>('/resources/v1');
                
                expect(res).toBeDefined();
                expect(res.length).toBe(1);
                expect(res[0].id).toBe(id);
            });
            
            it('should be possible to list all resources of a specific apiVersion and kind', async () => {
                const res = await testBed.client.get<ResourceInstance<any>[]>('/resources/v1/User');
                
                expect(res).toBeDefined();
                expect(res.length).toBe(1);
                expect(res[0].id).toBe(id);
            });
            
            it('should be possible to get a resource by ID', async () => {
                const res = await testBed.client.get<ResourceInstance<any>>(`/resource/${id}`);
                
                expect(res).toBeDefined();
                expect(res.id).toBe(id);
            });

            it('should return 4040 for an unknown resource by ID', async () => {
                const err = await testBed.client.get<ResourceInstance<any>>(`/resource/10`).catch(err => err);

                expect(err).toBeDefined();
                expect(err).toBeInstanceOf(Error);
                expect(err.statusCode).toBe(404);
            });
        });

        describe('updating', () => {
            let id: string;

            beforeEach(() => {
                id = manager.create({
                    apiVersion: 'v1',
                    kind: 'User',
                    spec: {
                        username: 'admin'
                    }
                });
            });

            it('should work', async () => {
                await testBed.client.put(`/resource/${id}`, {
                    apiVersion: 'v1',
                    kind: 'User',
                    spec: {
                        username: 'foobar'
                    }
                })

                expect((manager.getResourceById(id)!.spec as any).username).toBe('foobar');
            });
            
            it('should return 404 for unknown resources', async () => {
                const err = await testBed.client.put(`/resource/10`, {
                    apiVersion: 'v1',
                    kind: 'User',
                    spec: {
                        username: 'foobar'
                    }
                }).catch(err => err);

                expect(err.statusCode).toBe(404);
            });
            
            it('should return 400 for apiVersion changes', async () => {
                const err = await testBed.client.put(`/resource/${id}`, {
                    apiVersion: 'v2',
                    kind: 'User',
                    spec: {
                        username: 'foobar'
                    }
                }).catch(err => err);

                expect(err.statusCode).toBe(400);
            });
            
            it('should return 400 for kind changes', async () => {
                const err = await testBed.client.put(`/resource/${id}`, {
                    apiVersion: 'v1',
                    kind: 'Role',
                    spec: {
                        username: 'foobar'
                    }
                }).catch(err => err);

                expect(err.statusCode).toBe(400);
            });
        })
    });
})