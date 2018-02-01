import {Provider} from './provider';
import {ReflectiveKey} from './reflective_key';
import {resolveReflectiveProvider, ResolvedReflectiveProvider, ReflectiveDependency} from './reflective_provider';
import {Self, SkipSelf} from './annotations';

/**
 * @docs-internal
 * 
 * @description
 * Instructs the {@link ReflectiveInjector} to throw an error when instantiating a
 * given provides failes
 *
 */
const _THROW_NOT_FOUND = new Object();

export const THROW_NOT_FOUND = _THROW_NOT_FOUND;

/**
 * @docs-internal
 *
 * @description
 * A constant value for "undefined" that is used inside the injector (as "undefined") might
 * be a valid value
 */
const _UNDEFINED = new Object();

/**
 * @class ReflectiveInjector
 * 
 * @description
 * Provides hierarchical dependecy injection functionality
 * 
 * TODO(ppacher): improve docs
 */
export class ReflectiveInjector {
    readonly parent: ReflectiveInjector|null;
    readonly name: string;
    
    static readonly _INJECTOR_TOKEN = ReflectiveKey.get(ReflectiveInjector);

    private _instances = new Map<number, any>();
    private _providers: ResolvedReflectiveProvider[] = [];
    
    constructor(parent: ReflectiveInjector|null = null, name: string = '') {
        this.parent = parent;
        this.name = name;
    }
    
    /** 
     * Resolves one or more providers and adds them to the injector
     * 
     * @param p  A provider or a list of providers to add to the injector
     */
    addProvider(p: Provider|Provider[]): void {
        if (!Array.isArray(p)) {
            p = [p];
        }
        
        this._providers = this._providers.concat(p.map(provider => resolveReflectiveProvider(provider)));
    }
    
    /**
     * Resolves a set of parameters and creates a new {@link ReflectiveInjector}
     * 
     * @param providers One or more providers for the new injector
     * @param name      An optional name for the new injector
     */
    static resolveAndCreate(providers: Provider|Provider[], name: string = ''): ReflectiveInjector {
        const inj = new ReflectiveInjector(null, name);
        inj.addProvider(providers);

        return inj;
    }

    /**
     * Resolves a set of parameters and creates a new child {@link ReflectiveInjector} with
     * the current injector set as a parent
     * 
     * @param providers One or more providers for the new injector
     * @param name      An optional name for the new injector
     */
    resolveAndCreateChild(providers: Provider|Provider[], name: string = ''): ReflectiveInjector {
        const child = new ReflectiveInjector(this, name);
        child.addProvider(providers);
        
        return child;
    }
    
    /**
     * Returns (and may create) a new instance of the provider identified by `token`
     * 
     * @param token      A token specified the target of the Dependency Injection
     * @param notFound   Either a value that should be returned if no provider is found
     *                   or THROW_NOT_FOUND to throw an error
     */
    get<T>(token: any, notFound: any|null = _THROW_NOT_FOUND): T {
        const key = ReflectiveKey.get(token);
        return this._getByKey(key, null, notFound);
    }
    
    /**
     * Returns (and may create) a new instance of the provider identified by {@link ReflectiveKey} `key`
     * 
     * @param key        The {@link ReflectiveKey} identifying the target of the Dependency Injection
     * @param visibility The current visibility of the target. This may be {@link Skip}, {@link SkipSelf} or null
     * @param notFound   Either a value that should be returned if no provider is found
     *                   or THROW_NOT_FOUND to throw an error
     */
    _getByKey(key: ReflectiveKey, visibility: Self|SkipSelf|null, notFound: any|null): any {
        if (key === ReflectiveInjector._INJECTOR_TOKEN) {
            return this;
        }
        
        if (visibility instanceof Self) {
            return this._getOrCreateByKey(key, notFound);
        } else {
            return this._getByKeyBubble(key, visibility, notFound);
        }
    }
    
    _getByReflectiveDependency(dep: ReflectiveDependency, notFound: any|null = _THROW_NOT_FOUND): any {
        let instance: any = undefined;
        try {
            instance = this._getByKey(dep.key, dep.visibility, _THROW_NOT_FOUND);
        } catch {
            instance = undefined;
        }
        
        if (instance === undefined && !dep.optional) {
            return this._throwOrNotFound(dep.key, notFound);
        }
        
        return instance;
    }
    
    _getByKeyBubble(key: ReflectiveKey, visibility: Self|SkipSelf|null, notFound: any|null): any {
        let inj: ReflectiveInjector = this;

        if (visibility instanceof SkipSelf) {
            inj = this.parent;
        }
        
        let instance: any = undefined;
        while(inj !== null && instance === undefined) {
            instance = inj._getOrCreateByKey(key, _UNDEFINED);
            
            if (instance === _UNDEFINED) {
                instance = undefined;
            }
            
            inj = inj.parent;
        }
        
        if (instance !== undefined) {
            return instance;
        }
        
        return this._throwOrNotFound(key, notFound);
    }

    _getOrCreateByKey(key: ReflectiveKey, notFound: any|null) {
        if (this._instances.has(key.key)) {
            return this._instances.get(key.key);
        }
        
        let instance = this._instantiateByKey(key);
        if (instance !== undefined) {
            this._instances.set(key.key, instance);
            return instance;
        }
        
        return this._throwOrNotFound(key, notFound);
    }

    _instantiateByKey(key: ReflectiveKey): any {
        let provider = this._providers.find(p => p.key.key === key.key);
        
        if (provider === undefined) {
            return undefined;
        }
        
        return this._instantiateProvider(provider);
    }
    
    _instantiateProvider(provider: ResolvedReflectiveProvider): any {
        const factory = provider.resolvedFactory;
        const debs = provider.resolvedFactory.dependencies.map(dep => this._getByReflectiveDependency(dep, _UNDEFINED));
        
        if (debs.some(d => d === _UNDEFINED)) {
            let args: string[] = [];
            
            for(let i = 0; i < debs.length; i++) {
                if (debs[i] === _UNDEFINED) {
                    args.push('?')
                    continue;
                }
                
                args.push(provider.resolvedFactory.dependencies[i].key.name);
            }

            throw new Error(`Failed to create ${provider.key.name}(${args.join(', ')})`);
        }
        
        const instance = factory.factory(...debs);
        return instance;
    }
    
    _throwOrNotFound(key: ReflectiveKey, notFound: any) {
        if (notFound === _THROW_NOT_FOUND) {
            throw new Error(`Cannot create instance of ${key.name}`);
        }
        
        return notFound;
    }
    
    toString(): string {
        return `${this.name}[${this._providers.map(p => p.key.name).join(', ')}]`;
    }
}

const _rootInjector = new ReflectiveInjector(null, '(root)');

export function getRootInjector(): ReflectiveInjector {
    return _rootInjector;
}