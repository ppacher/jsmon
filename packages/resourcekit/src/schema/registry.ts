// TODO(ppacher): make add/get/has/delete/getKinds/validateResource async
import { Schema, Resource } from './schema';
import Validator from './validator';
import { LockedError, NotFoundError, PreconditionFailedError } from 'restify-errors';

export class SchemaRegistry {
    private readonly _schemas: Map<
        string,
        Map<
            string,
            Schema
        >
    > = new Map();
    
    /** A map counting references to a schema */
    private readonly _schemaReferenceLocks: Map<string, number> = new Map();
    
    /**
     * Adds a new schema to the registry
     * 
     * @param s - The schema to add
     */
    public add(s: Schema) {
        if (!this._schemas.has(s.apiVersion)) {
            this._schemas.set(s.apiVersion, new Map());
        }

        if (this._schemas.get(s.apiVersion)!.has(s.kind)) {
            throw new Error(`Schema ${s.apiVersion}#${s.kind} already registered`);
        }
        
        this._schemas.get(s.apiVersion)!.set(s.kind, s);
    }

    /**
     * Returns the resource schema definition or null
     * 
     * @param apiVersion - The API version of the resource
     * @param kind - The kind of resource
     */
    public get(apiVersion: string, kind: string): Schema | null {
        if (!this._schemas.has(apiVersion)) {
            return null
        }

        return this._schemas.get(apiVersion)!.get(kind) || null;
    }
    
    /**
     * Checks if the schema registry has a resource definition for the given
     * version and kind
     * 
     * @param apiVersion - The API version of the resource
     * @param kind - The kind of resource
     */
    public has(apiVersion: string, kind: string): boolean {
        if (!this._schemas.has(apiVersion)) {
            return false
        }

        return this._schemas.get(apiVersion)!.has(kind);
    }
    
    public lock(s: Schema): void;
    public lock(apiVersion: string, kind: string): void;
    public lock(schemaOrVersion: Schema|string, kind?: string) {
        let schema: Schema | null;

        if (typeof schemaOrVersion === 'object') {
            schema = schemaOrVersion
        
            if (!this.has(schema.apiVersion, schema.kind)) {
                throw new NotFoundError(`Unknown schema ${schema.apiVersion}#${schema.kind}`);
            }
        } else {
            schema = this.get(schemaOrVersion, kind!);
            
            if (schema === null) {
                throw new NotFoundError(`Unknown schema ${schemaOrVersion}#${kind}`);
            }
        }
        
        const schemaName = `${schema.apiVersion}#${schema.kind}`;

        this._schemaReferenceLocks.set(schemaName, (this._schemaReferenceLocks.get(schemaName) || 0) + 1);
    }
    
    public unlock(s: Schema): void;
    public unlock(apiVersion: string, kind: string): void;
    public unlock(schemaOrVersion: Schema|string, kind?: string): void {
        let schema: Schema | null;

        if (typeof schemaOrVersion === 'object') {
            schema = schemaOrVersion;

            if (!this.has(schema.apiVersion, schema.kind)) {
                throw new NotFoundError(`Unknown schema ${schema.apiVersion}#${schema.kind}`);
            }
        } else {
            schema = this.get(schemaOrVersion, kind!);
            if (schema === null) {
                throw new NotFoundError(`Unknown schema ${schemaOrVersion}#${kind}`);
            }
        }
        
        const schemaName = `${schema.apiVersion}#${schema.kind}`;
        const refCount = this._schemaReferenceLocks.get(schemaName) || 0;

        if (refCount === 0) {
            throw new PreconditionFailedError(`Failed to unlock schema ${schemaName}. Reference count is already 0`);
        }
        
        this._schemaReferenceLocks.set(schemaName, refCount - 1);
    }
    
    public isLocked(s: Schema): boolean;
    public isLocked(apiVersion: string, kind: string): boolean;
    public isLocked(schemaOrVersion: Schema|string, kind?: string): boolean {
        let schema: Schema | null;

        if (typeof schemaOrVersion === 'object') {
            schema = schemaOrVersion;

            if (!this.has(schema.apiVersion, schema.kind)) {
                throw new NotFoundError(`Unknown schema ${schema.apiVersion}#${schema.kind}`);
            }
        } else {
            schema = this.get(schemaOrVersion, kind!);
            if (schema === null) {
                throw new NotFoundError(`Unknown schema ${schemaOrVersion}#${kind}`);
            }
        }

        const refCount = this._schemaReferenceLocks.get(`${schema.apiVersion}#${schema.kind}`) || 0;
        
        return refCount > 0;
    }
    
    /**
     * Deletes a schema from the registry
     * 
     * @param s - The schema to delete
     */ 
    public delete(s: Schema): boolean {
        if (!this._schemas.has(s.apiVersion)) {
            return false;
        }
        
        if (this.isLocked(s)) {
            throw new LockedError(`Schema ${s.apiVersion}#${s.kind} still used`);
        }
        
        return this._schemas.get(s.apiVersion)!.delete(s.kind);
    }
    
    /**
     * Returns a list of available resource kinds
     * 
     * @param apiVersion - The API version to load resource kinds
     */
    public getKinds(apiVersion: string): string[] {
        const kinds = this._schemas.get(apiVersion);

        if (!kinds) {
            return [];
        }
        
        return Array.from(kinds.keys());
    }

    /**
     * Returns a list of known apiVersions
     */
    public getVersions(): string[] {
        const versions = Array.from(this._schemas.keys());
        return versions;
    }
    
    /**
     * Validates if a given resources matches it's schema definition
     * 
     * @param obj - The resource object to validate
     */
    public validateResource<T = any>(obj: Resource<T>): Error | null {
        const apiVersion = obj.apiVersion;
        const kind = obj.kind;

        if (!apiVersion || !kind) {
            return new Error(`Invalid resource definition. Either apiVersion or kind is missing`);
        }
        
        const schema = this.get(apiVersion, kind);
        if (schema === null) {
            return new Error(`Failed to validate resource. Unknown schema ${apiVersion}#${kind}`);
        }
        
        return Validator.validate(obj, schema);
    }
}
