import 'reflect-metadata';

import {Token} from './token';
import {Type} from './type';
import {BaseToken, Provider, ClassProvider, FactoryProvider, ValueProvider} from './provider';
import {ANNOTATIONS, PARAMETERS} from '../utils/decorator';
import {SkipSelf, Self, Inject, Optional} from './annotations';

/**
 * @private
 */
interface NormalizedProvider extends ClassProvider, FactoryProvider, ValueProvider {};

/**
 * @private
 */
interface ResolvedDependency<T> {
    token: Token<T>;

    annotations: {
        visibility: 'self' | 'skipself' | null;
        optional: boolean;
    }
}

/**
 * @private
 */
interface ResolvedProvider<T> {
    token: Token<T>;

    factory: (...args: any[]) => T;
    
    dependecies: ResolvedDependency<any>[];
}

/**
 * @class Injector
 */
export abstract class Injector {
    /**
     * Returns an existing or creates a new instance for the given DI token
     * 
     * @param token  A DI token that identifies the type object to return
     */
    abstract get<T>(token: Token<T>): T;
    
    /** Returns the injectors parent or null if there is no parent */
    abstract get parent(): Injector|null;
    
    /**
     * Resolves a set of provides and creates a new child injector
     * 
     * @param providers  One or more provides for the new child injector
     */
    abstract resolveAndCreateChild(providers: Provider|Provider[]): Injector;
    
    /**
     * 
     * @param providers  One or more providers to add to the current injector
     */
    abstract addProviders(providers: Provider|Provider[]): void;

    /**
     * Creates a new injector
     * 
     * @param providers     A list of dependecy injection providers to use for the new injector
     * @param parent        An optional parent for the new injector
     */
    static fromProviders(providers: Provider[], parent: Injector = null): Injector {
        const injector = new _Injector(parent);

        injector.resolveProviders(providers);

        return injector;
    }
}

class _Injector extends Injector {
    readonly parent: Injector|null;
    
    private _providers: Map<Token<any>, ResolvedProvider<any>> = new Map<Token<any>, ResolvedProvider<any>>();
    private _instanceCache: Map<Token<any>, any> = new Map<Token<any>, any>();

    constructor(parent: Injector = null) {
        super();

        // We always provide ourself as a dependecy injection provider
        this._providers.set(Injector, {
            token: Injector,
            factory: () => this,
            dependecies: [],
        });
        
        this.parent = parent;
    }

    get<T>(token: Token<T>|Type<T>, circular: Token<any>[] = []): T {
        if (!this._providers.has(token)) {
            if (this.parent !== null) {
                return this.parent.get(token);
            }
            
            throw new Error(`Unknown provider for token ${token}`);
        }
        
        let resolved = this._providers.get(token);
        let deps = this._resolveDependecies(resolved, [...circular, token]);
        
        let instance = resolved.factory(...deps);
        this._instanceCache.set(token, instance);
        
        return instance;
    }

    resolveAndCreateChild(p: Provider|Provider[]): Injector {
        if (!Array.isArray(p)) {
            p = [p];
        }
        
        return Injector.fromProviders(p, this);
    }
    
    addProviders(provider: Provider|Provider[]): void {
        this.resolveProviders(provider);
    }

    _resolveDependecies(provider: ResolvedProvider<any>, circular: Token<any>[]): any[] {
        let deps: any[] = [];
        
        provider.dependecies.forEach(dep => {
            let d = this._providers.get(dep.token);
            let instance: any = undefined;
            
            if (d !== undefined && dep.annotations.visibility !== 'skipself') {
                if (circular.find(t => t === d.token)) {
                    throw new Error(`Cicular dependecy on ${d.token} detected`);
                }
                
                instance = this._getOrCreate(d);
            } else {
                if (dep.annotations.visibility === 'self' && !dep.annotations.optional) {
                    throw new Error(`Unknown provider for ${dep.token}`);
                }
                
                try {
                    console.log(`Querying parent for ${dep.token}`);
                    instance = this.parent.get(dep.token);
                } catch {}
                
                if (instance === undefined && !dep.annotations.optional) {
                    throw new Error(`Unknown provider for ${dep.token}`);
                }
            }
            
            deps.push(instance);
        });

        return deps;
    }

    _getOrCreate(provider: ResolvedProvider<any>): any {
        if (this._instanceCache.has(provider.token)) {
            return this._instanceCache.get(provider.token);
        }
        
        let instance = this.get(provider.token);
        
        return instance;
    }
    
    resolveProviders(provider: Provider|Provider[]): void {
        if (!Array.isArray(provider)) {
            provider = [provider];
        }
        
        provider.forEach(p => {
            let resolved = this._resolveProvider(p);
            
            if (this._providers.has(resolved.token)) {
                throw new Error(`Provider already registered for token ${resolved.token}`);
            }
            
            this._providers.set(resolved.token, resolved);
        });
    }
    
    _resolveProvider(p: Provider): ResolvedProvider<any> {
        let provider: NormalizedProvider;

        if (typeof p === 'function') {
            provider = {
                provide: p,
                useClass: p,
            } as NormalizedProvider;
        } else {
            provider = p as NormalizedProvider;
        }

        let factory: (...args: any[]) => any;
        let dependecies: ResolvedDependency<any>[];

        if(provider.useValue !== undefined) {
            factory = () => provider.useValue;
            if (provider.debs !== undefined) {
                throw new Error(`A ValueProvider must not have dependecies`);
            }
            dependecies = [];
        } else
        if (provider.useClass !== undefined) {
            factory = (...args: any[]) => new provider.useClass.prototype.constructor(...args);
            if (provider.debs === undefined) {
                dependecies = _getClassDependecies(provider.useClass);
            } else {
                dependecies = _parseDependecies(provider.debs);
            }


        } else
        if (provider.useFactory !== undefined) {
            factory = provider.useFactory;
            if (provider.debs !== undefined) {
                dependecies = _parseDependecies(provider.debs);
            } else {
                dependecies = [];
            }
        } else {
            throw new Error(`unsupported provider type`);
        }
        
        return {
            token: provider.provide,
            dependecies: dependecies,
            factory: factory,
        };
    }
}

function _getClassDependecies(cls: Type<any>): ResolvedDependency<any>[] {
    let params = Reflect.getMetadata('design:paramtypes', cls);
    
    if (params === undefined || params.length === 0) {
        return [];
    }
    let annotations = Object.getOwnPropertyDescriptor(cls, PARAMETERS);
    
    let metadata = annotations ? annotations.value : new Array(params.length).fill([]);
    
    return _zipParametersAndAnnotations(params, metadata);
}

function _parseDependecies(debs: any[]): ResolvedDependency<any>[] {
    let resolved: ResolvedDependency<any>[] = [];

    debs.forEach(dependency => {
        if (Array.isArray(dependency)) {
            const token = dependency[dependency.length -1];
            const annotations = dependency.slice(0, dependency.length -2);
            let r = _zipParametersAndAnnotations([token], [annotations]);
            resolved.push(r[0]);
            
        } else {
            resolved.push({
                token: dependency,
                annotations: {
                    visibility: null,
                    optional: false,
                },
            });
        }
    });
    
    return resolved;
}

function _zipParametersAndAnnotations(params: any[], annotations: any[][]): ResolvedDependency<any>[] {
    let debs: ResolvedDependency<any>[] = [];
    
    for(let i = 0; i < params.length; i++) {
        let r: ResolvedDependency<any> = {
            token: params[i],
            annotations: {
                visibility: null,
                optional: false,
            }
        };
        
        let skipSelf = annotations[i].find(m => m instanceof SkipSelf) !== undefined;
        let self = annotations[i].find(m => m instanceof Self) !== undefined ;
        
        if (self && skipSelf) {
            throw new Error(`invalid annotation for parameter ${r.token}`);
        }

        if (self) {
            r.annotations.visibility = 'self';
        }
        
        if (skipSelf) {
            r.annotations.visibility = 'skipself';
        }

        let inject: Inject = annotations[i].find(m => m instanceof Inject);
        if (inject !== undefined) {
            r.token = inject.token;
        }

        r.annotations.optional = annotations[i].find(m => m instanceof Optional) !== undefined;
        
        debs.push(r);
    }

    return debs;
}

let RootInjector: Injector|null = null;

export function getRootInjector(): Injector {
    return RootInjector || createRootInjector();
}

function createRootInjector(): Injector {
    if (!!RootInjector) {
        return RootInjector;
    }
    
    RootInjector = Injector.fromProviders([]);
    return RootInjector;
}

createRootInjector();