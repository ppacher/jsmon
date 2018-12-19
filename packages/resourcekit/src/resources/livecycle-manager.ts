import { Injectable, Optional } from '@jsmon/core';
import { Observable, Subject } from 'rxjs';
import { Resource, SchemaRegistry } from '../schema';
import { Matcher, ResourceFilter } from './matcher';
import { BadRequestError, NotFoundError } from 'restify-errors';

export interface ResourceInstance<T> extends Resource<T> {
    /** The unique resource identifier created by the live-cycle manager */
    id: string;
}

@Injectable()
export class LiveCycleManager {
    /** Caches resource objects by apiVersion and kind */
    private readonly _objects: Map<string, Map<string, ResourceInstance<any>[]>> = new Map();
    
    /** Caches resource objects by ID */
    private readonly _objectsById: Map<string, ResourceInstance<any>> = new Map();
    
    /** Subject that emits each resource created */
    private readonly _onResourceCreated: Subject<ResourceInstance<any>> = new Subject();
    
    /** Subject that emits each resource deleted */
    private readonly _onResourceDeleted: Subject<ResourceInstance<any>> = new Subject();
    
    /** Subject that emits each resource updated */
    private readonly _onResourceUpdated: Subject<ResourceInstance<any>> = new Subject();

    /**
     * @param [_registry] - The schema registry to use. If undefined a new one will be created
     */
    constructor(@Optional() public readonly schemas: SchemaRegistry = new SchemaRegistry()) {}
    
    /** Emits each {@link ResourceInstance} that has been created */
    get onResourceCreated(): Observable<ResourceInstance<any>> {
        return this._onResourceCreated.asObservable(); 
    }
    
    /** Emits each {@link ResourceInstance} that has been deleted */
    get onResourceDeleted(): Observable<ResourceInstance<any>> {
        return this._onResourceDeleted.asObservable();
    }
    
    /** Emits each {@link ResourceInstance} that has been updated */
    get onResourceUpdated(): Observable<ResourceInstance<any>> {
        return this._onResourceUpdated.asObservable();
    }
    
    /**
     * Stores a new resource inside the manager
     * 
     * @param obj - The resource to store
     */
    create(obj: Resource<any>) {
        if (!this.schemas.has(obj.apiVersion, obj.kind)) {
            throw new NotFoundError(`Unknown schema ${obj.apiVersion}#${obj.kind}`);
        }
        
        const validationError = this.schemas.validateResource(obj);

        if (validationError !== null) {
            throw new BadRequestError(validationError.message);
        }
        
        if (this._objects.get(obj.apiVersion) === undefined) {
            this._objects.set(obj.apiVersion, new Map());
        }
        
        const resources = this._objects.get(obj.apiVersion)!.get(obj.kind) || [];
        let id: string = this._generateID();

        // Search for a valid resource ID
        while (true) {
            if (this._objectsById.get(id) === undefined) {
                break;
            }
        }
        
        this.schemas.lock(obj.apiVersion, obj.kind);
        
        const instance = {
            ...obj,
            id
        };

        resources.push(instance);
        this._objectsById.set(id, instance);
        
        this._objects.get(obj.apiVersion)!.set(obj.kind, resources);
        
        // Notify watcher about the new resource in the next tick
        setTimeout(() => this._onResourceCreated.next(instance), 1);
        
        return id;
    }

    /**
     * Updates a given resource
     *
     * @note it is not allowed to change the apiVersion or kind of a resource
     * 
     * @param r - The resource to update
     */
    update(r: ResourceInstance<any>): boolean {
        const existing = this.getResourceById(r.id);
        if (!existing) {
            return false;
        }

        const validationError = this.schemas.validateResource(r);
        if (validationError !== null) {
            throw new BadRequestError(validationError.message);
        }
        
        // Ensure the user does not attempt to change the apiVersion or kind of a resource
        if (r.apiVersion !== existing.apiVersion || r.kind !== existing.kind) {
            throw new Error(`Cannot update the apiVersion or kind of a resource`);
        }
        
        this._objectsById.set(r.id, r);
        const all = this.getResources(r.apiVersion, r.kind)
                        .filter(a => a.id !== r.id);
        
        all.push(r);

        this._objects.get(r.apiVersion)!.set(r.kind, all);
        
        // Notify watcher about the update in the next tick
        setTimeout(() => this._onResourceUpdated.next(r), 1);
        
        return true;
    }
    
    /**
     * Deletes a resource from the live-cycle manager
     * 
     * @param objOrId - The resource instance or the ID of the resource
     */
    delete(objOrId: ResourceInstance<any>|string): boolean {
        let id: string;
        if (typeof objOrId === 'object') {
            id = objOrId.id;
        } else {
            id = objOrId;
        }
        
        const resource = this.getResourceById(id);

        if (!resource) {
            return false;
        }
        
        const all = this.getResources(resource.apiVersion, resource.kind)
                        .filter(r => r.id !== id);

        this._objects.get(resource.apiVersion)!.set(resource.kind, all);
        this._objectsById.delete(resource.id);
        
        this.schemas.unlock(resource.apiVersion, resource.kind);

        // Notify watcher about the deleted resource on the next tick
        setTimeout(() => this._onResourceDeleted.next(resource), 1);

        return true;
    }
    
    /**
     * Returns all resources from a given version and kind
     * 
     * @param apiVersion - The API version of the resource
     * @param kind - The kind of resource
     */
    getResources<T>(apiVersion: string, kind: string): ResourceInstance<T>[] {
        const kinds = this._objects.get(apiVersion);

        if (!kinds) {
            return [];
        }
        
        return kinds.get(kind) || [];
    }

    /**
     * Returns all resources managed by the LiveCycleManager
     */
    getAllResources(): ResourceInstance<any>[] {
        const values = Array.from(this._objectsById.values());

        return values;
    }

    /**
     * Returns a resource object identified by it's unique ID
     * 
     * @param id - The unique identifier of the resource object
     */
    getResourceById<T>(id: string): ResourceInstance<T> | undefined {
        return this._objectsById.get(id);
    }
    
    /**
     * Searches through all available resources and returns those matching the
     * resource filter
     * 
     * @param filter - The resource filter to use
     */
    filter<T>(filter: ResourceFilter<T>): ResourceInstance<T>[] {
        // If the filter has an ID set, we can acutally fall bac to getResourceById
        if (!!filter.id) {
            const obj = this.getResourceById<T>(filter.id);
            if (!!obj) {
                return [obj];
            }
            
            return [];
        }
        
        // If we don't even know about the specified schema we can bail out
        const schema = this.schemas.get(filter.apiVersion, filter.kind);
        if (!schema) {
            return [];
        }

        // Search through all registered resources of the given version and kind
        const all = this.getResources<T>(filter.apiVersion, filter.kind);
        return all.filter(resource => Matcher.match(filter.spec, resource.spec, schema.specDefinition))
    }
    
    /**
     * Returns the first resource instance that matches the given filter
     * 
     * @param filter - The resource filter to use
     */
    findOne<T>(filter: ResourceFilter<T>): ResourceInstance<T> | null {
        const all = this.filter(filter);

        if (all.length === 0) {
            return null;
        }
        
        return all[0];
    }
    
    /** Returns a random string to be used for resource IDs */
    private _generateID(): string {
        return Math.random().toString(16).substring(2, 12);
    }
}