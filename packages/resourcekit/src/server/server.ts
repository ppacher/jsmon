import { Injectable, Logger, NoopLogAdapter, Optional } from '@jsmon/core';
import { HttpServer, Get, Post, Put, Delete, Definition, Property, Required } from '@jsmon/net/http/server';
import { Request, Response, Next } from 'restify';
import { LiveCycleManager, ResourceInstance } from '../resources';
import { Schema, Resource, ObjectType, TypeDefinition } from '../schema';
import { BadRequestError, NotFoundError, InternalServerError } from 'restify-errors';

export class ResourceServerConfig {
    enableSchemaCRUD: boolean = true;
}

@Definition()
export class SchemaDefinitionBody {
    @Required()
    @Property('string')
    apiVersion: string = '';

    @Required()
    @Property('string')
    kind: string = '';
    
    @Required()
    @Property('object', {
        disableValidation: true,
    })
    specDefinition: ObjectType = {
        type: 'object',
        properties: {}
    }
}

@Injectable()
export class ResourceServer {
    /**
     * Registers a {@link ResourceServer} on a {@link HttpServer} instance
     *
     * @param prefix - The route prefix to use
     * @param server - The HttpServer instance that should be used to serve resources
     */
    static mount(prefix: string, server: HttpServer) {
        server.mount(prefix, ResourceServer);
    }
    
    constructor(private _manager: LiveCycleManager,
                @Optional() private _config: ResourceServerConfig = new ResourceServerConfig(),
                @Optional() private _log: Logger = new Logger(new NoopLogAdapter)) {}
    
    //
    // Schema handlers
    //

    @Get('/schemas', {
        description: 'Returns an object of all supported schema kinds grouped by schema apiVersion'
    })
    async listSchemas(req: Request, res: Response, next: Next) {
        try {
            const versions = this._manager.schemas.getVersions();

            const schemas: {
                [apiVersion: string]: Schema[]
            } = {};

            versions.forEach(apiVersion => {
                const kinds = this._manager.schemas.getKinds(apiVersion)
                                  .map(kind => this._manager.schemas.get(apiVersion, kind)!);
                schemas[apiVersion] = kinds;
            });

            res.send(200, schemas);
            next();
        } catch (err) {
            next(this._wrapError(err));
        }
    }
    
    @Get('/schemas/:apiVersion', {
        description: 'Returns all supported schema kinds for the given version',
        parameters: {
            apiVersion: {
                type: 'string',
                description: 'The apiVersion to return schema kinds for'
            }
        }
    })
    async listSchemasByVersion(req: Request, res: Response, next: Next) {
        try {
            const kinds = this._manager.schemas.getKinds(req.params.apiVersion)
                              .map(kind => this._manager.schemas.get(req.params.apiVersion, kind)!);

            res.send(200, kinds);
        } catch (err) {
            next(this._wrapError(err));
        }
    }
    
    @Get('/schemas/:apiVersion/:kind', {
        description: 'Returns the schema kind',
        parameters: {
            apiVersion: {
                type: 'string',
                description: 'The apiVersion of the schema kind'
            },
            kind: {
                type: 'string',
                description: 'The kind of resource'
            }
        }
    })
    async getSchemaKind(req: Request, res: Response, next: Next) {
        try {
            const kind = this._manager.schemas.get(req.params.apiVersion, req.params.kind);
            if (!kind) {
                throw new NotFoundError(`Failed to find schema for ${req.params.apiVersion}#${req.params.kind}`);
            }

            res.send(200, kind);
            next();
        } catch (err) {
            next(this._wrapError(err));
        }
    }

    @Post('/schemas', {
        description: 'Creates a new schema',
        body: SchemaDefinitionBody
    })
    async createSchema(req: Request, res: Response, next: Next) {
        if (!this._config.enableSchemaCRUD) {
            res.send(404);
            next();
            return;
        }

        try {
            const schema = req.body;

            if (!schema || typeof schema !== 'object') {
               throw new BadRequestError(`Invalid body`);
            }

            this._manager.schemas.add(schema);
            res.send(204);
            next();
        } catch (err) {
            next(this._wrapError(err));
        }
    }
    
    @Delete('/schemas/:apiVersion/:kind', {
        description: 'Deletes a schema kind',
        parameters: {
            apiVersion: {
                type: 'string',
                description: 'The apiVersion of the schema kind'
            },
            kind: {
                type: 'string',
                description: 'The name of the schema kind'
            }
        }
    })
    async deleteSchemaKind(req: Request, res: Response, next: Next) {
        if (!this._config.enableSchemaCRUD) {
            res.send(404);
            next();
            return;
        }
        
        try {
            const apiVersion = req.params.apiVersion;
            const kind = req.params.kind;
            const schema = this._manager.schemas.get(apiVersion, kind);
            
            if (!schema) {
                throw new NotFoundError(`Unknown schema ${apiVersion}#${kind}`);
            }
            
            this._manager.schemas.delete(schema);

            res.send(204);
            next();
        } catch (err) {
            next(this._wrapError(err));
        }
    }
    

    //
    // Resource handlers
    //

    @Get('/resources', {
        description: 'Returns all available resources'
    })
    @Get('/resources/:apiVersion', {
        description: 'Returns all available resource with the given version',
        parameters: {
            apiVersion: 'string'
        }
    })
    @Get('/resources/:apiVersion/:kind', {
        description: 'Returns all available resources of the given schema kind',
        parameters: {
            apiVersion: 'string',
            kind: 'string'
        }
    })
    async listResources(req: Request, res: Response, next: Next) {
        try {
            let resources: ResourceInstance<any>[] = [];
            
            if (req.params.apiVersion) {
                if (req.params.kind) {
                    resources = this._manager.getResources(req.params.apiVersion, req.params.kind);
                } else {
                    resources = this._manager.getAllResources()
                                    .filter(r => r.apiVersion === req.params.apiVersion);
                }
            } else {
                resources = this._manager.getAllResources();
            }
            
            res.send(200, resources);
            next();
        } catch (err) {
            next(this._wrapError(err));
        }
    }
    
    @Post('/resources', {
        description: 'Creates a new resource',
        body: {
            type: 'object',
            disableValidation: true,
            name: 'Resource',
            properties: {},
            required: [],
        }
    })
    async createResource(req: Request, res: Response, next: Next) {
        try {
            const resource: Resource<any> = req.body;
            const id = this._manager.create(resource);
            
            res.send(200, id);
            next();
        } catch (err) {
            next(this._wrapError(err));
        }
    }
    
    @Delete('/resource/:id', {
        description: 'Deletes the resource with the given ID',
        parameters: {
            id: 'string'
        }
    })
    async deleteResource(req: Request, res: Response, next: Next) {
        try {
            const id = req.params.id;

            if (this._manager.delete(id)) {
                res.send(204);
                next();
            } else {
                throw new NotFoundError(`Unknown resource with id ${id}`);
            }
            
        } catch (err) {
            next(this._wrapError(err));
        }
    }
    
    @Get('/resource/:id', {
        description: 'Returns the resource by ID',
        parameters: {
            id: 'string'
        }
    })
    async getResource(req: Request, res: Response, next: Next) {
        try {
            const resource = this._manager.getResourceById(req.params.id);
            if (!resource) {
                throw new NotFoundError(`Resource with id ${req.params.id} does not exist`);
            } 
            
            res.send(200, resource);
            next();
        } catch (err) {
            next(this._wrapError(err));
        }
    }
    
    @Put('/resource/:id', {
        description: 'Updates the resource with the given ID',
        parameters: {
            id: 'string'
        },
        body: {
            type: 'object',
            description: 'The updated resource',
            disableValidation: true,
            name: 'Resource',
            required: [],
            properties: {}
        }
    })
    async updateResource(req: Request, res: Response, next: Next) {
        try {
            const id = req.params.id;
            const resource: Resource<any> = req.body;

            if (!!(resource as ResourceInstance<any>).id && (resource as ResourceInstance<any>).id !== id) {
                throw new BadRequestError(`Resource IDs do not match`);
            }
            
            const updated = this._manager.update({
                ...resource,
                id: id
            });
            
            if (!updated) {
                throw new NotFoundError(`Unknown resource ${id}`);
            }
            
            res.send(204);
            next();
        } catch (err) {
            next(this._wrapError(err));
        }
    }
    
    /**
     * @internal
     * Logs an error to the console and, if running in production, returns an
     * internal server error instead. In dev mode, the error is forwarded to
     * the client
     * 
     * @param err - The error to wrap
     */
    private _wrapError(err: Error): Error {
        if ((err as any).statusCode === undefined) {
            console.error(err);
        }
        
        // If we are running in production mode make sure to not expose an
        // internal error
        if (process.env.NODE_ENV === 'production') {
            // If the errors already has a statusCode set, we can safely return it as it
            // was meant to be sent to the client
            if ((err as any).statusCode !== undefined) {
                return err;
            }
            
            return new InternalServerError();
        } else {
            return err;
        }
    }
}