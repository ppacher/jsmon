import {ResolvedDependency, ResolvedProvider, resolveProvider} from './resolved_provider';
import {ProviderKey} from './key';
import {Provider} from './provider';
import {Type} from './type';

const _UNDEFINED = new Object();
const _THROW_NOT_FOUND = new Object();

export interface DisposeCallback {
    (injector: Injector): void;
}

export interface OnDestroy {
    onDestroy: () => void;
}

export function isDestroyable(value: any): value is OnDestroy {
    return ('onDestroy' in value);
}

export class Injector {
    private static _INJECTOR_KEY = ProviderKey.get(Injector);
    private _providerByKey: Map<ProviderKey, ResolvedProvider<any>> = new Map<ProviderKey, ResolvedProvider<any>>();
    private _instanceByKey: Map<ProviderKey, any> = new Map<ProviderKey, any>(); 
    private _instances: any[] = [];
    private _disposeFns: DisposeCallback[] = [];
    
    private readonly _disposeHandler: DisposeCallback = (inj) => {
        if (inj !== this.parent) {
            throw new Error(`Invalid origin for dispose handler`);
        }
        this.dispose();
    }
    
    constructor(providers: Provider|Provider[], private parent?: Injector) {
        if (!!parent) {
            parent._registerDisposeFn(this._disposeHandler);
        }
        
        this._provide(providers);
    }
    
    public get<T>(token: Type<T>|any, notFound: any = _THROW_NOT_FOUND): T {
        let key = ProviderKey.get(token);

        return this._getByKeyBubble(key, notFound);
    }
    
    public createChild(providers: Provider|Provider[]): Injector {
        return new Injector(providers, this);
    }
    
    public dispose(): void {
        // unregister our dispose handler from the parent injector
        if (!!this.parent) {
            this.parent._unregisterDesponseFn(this._disposeHandler);
        }
        
        // call all dispose callbacks
        this._disposeFns.forEach(fn => fn(this));
        
        // cleanup
        this._providerByKey.clear();
        this._instanceByKey.clear();
        
        // Call any destroy callbacks for created instances
        this._destroyInstances();
    }
    
    _getByKey<T>(key: ProviderKey, notFound: any): T {
        if (key === Injector._INJECTOR_KEY) {
            return this as any;
        }

        const provider = this._providerByKey.get(key);
        
        if (provider === undefined) {
            if (notFound !== _THROW_NOT_FOUND) {
                return notFound;
            }

            throw new Error(`No provider for ${key}`);
        }
        
        if (this._instanceByKey.has(key)) {
            return this._instanceByKey.get(key)!;
        }

        return this._instantiate(provider);
    }
    
    _getByKeyBubble<T>(key: ProviderKey, notFound: any, visibility: 'self'|'skipself'|null = null): T {
        let inj: Injector|undefined = this;
        
        if (visibility === 'skipself') {
            inj = inj.parent;
        }

        while(inj instanceof Injector && !!inj) {
            let instance = inj._getByKey<T>(key, _UNDEFINED);

            if (instance !== _UNDEFINED) {
                return instance;
            }
            
            if (visibility === 'self') {
                inj = undefined;
                break;
            }
            
            inj = inj.parent;
        }

        if (!!inj) {
            return inj!.get(key, notFound);
        }
        
        if (notFound === _THROW_NOT_FOUND) {
            throw new Error(`Failed to create ${key.displayName}`);
        }

        return notFound;
    }
    
    // TODO(ppacher): finish support for multi providers
    _instantiate<T>(p: ResolvedProvider<T>): T|T[] {
        if (p.factories.length > 1 && !p.multi) {
            throw new Error(`Invalid provider state`);
        }
        
        let result: T[] = [];
        
        p.factories.forEach(resolvedFactory => {
            let deps = resolvedFactory.dependencies.map(d => this._getByResolvedDependency(d));
            
            if (deps.some((d, index) => d === _UNDEFINED && resolvedFactory.dependencies[index].optional === false)) {
                let args: string[] = resolvedFactory.dependencies.map((dep, index) => {
                    if (deps[index] !== _UNDEFINED) {
                        return dep.key.displayName;
                    }
                    return `${dep.key.displayName}?`;
                });
                
                throw new Error(`Cannot create ${p.key.displayName}(${args.join(', ')})`);
            }
            
            // at this point, all _UNDEFINED dependencies are optional and need to be replaced
            deps = deps.map(d => d === _UNDEFINED ? undefined : d);

            const instance = resolvedFactory.factory(...deps);
            
            result.push(instance);
        });

        if (p.multi) {
            // since this request is about a multi provider we need to 
            // query all parent injectors for the same provider
            let parentResults = this._getByKeyBubble(p.key, _UNDEFINED, 'skipself');
            if (parentResults !== _UNDEFINED) {
                if (!Array.isArray(parentResults)) {
                    throw new Error(`Parent Injector returned invalid response`);
                }
                
                result = result.concat(parentResults);
            }

            this._instanceByKey.set(p.key, result);
            this._instances.push(result);
            return result;
        } else {
            this._instanceByKey.set(p.key, result[0]);
            this._instances.push(result[0]);
            return result[0];
        }
    }

    _getByResolvedDependency(dep: ResolvedDependency): any {
        if (this._instanceByKey.has(dep.key)) {
            return this._instanceByKey.get(dep.key);
        }
        
        return this._getByKeyBubble(dep.key, _UNDEFINED, dep.visibility);
    }
    
    toString(): string {
        let s = Array.from(this._providerByKey.values()).map(p => p.key.displayName).join(', ');
        
        return `Injector(providers=${s})`;
    }
    
    protected _registerDisposeFn(fn: DisposeCallback): void {
        this._disposeFns.push(fn);
    }
    
    protected _unregisterDesponseFn(fn: DisposeCallback): void {
        let idx = this._disposeFns.indexOf(fn);
        
        if (idx > -1) {
            this._disposeFns.splice(idx, 1);
        }
    }
    
    private _destroyInstances(): void {
        this._instances.forEach(instance => {
            if (isDestroyable(instance)) {
                instance.onDestroy();
            }
        });
        
        this._instances = [];
    }
    
    private _provide(p: Provider|Provider[]): void {
        let providers: Provider[];

        if (Array.isArray(p)) {
            providers = p;
        } else {
            providers = [p];
        }

        providers.forEach(p => this._resolveProvider(p));
    }
    
    
    private _resolveProvider(p: Provider) {
        const resolved = resolveProvider(p);

        if (this._providerByKey.has(resolved.key)) {
            let existing = this._providerByKey.get(resolved.key)!;

            if (existing.multi !== resolved.multi) {
                throw new Error(`For multi providers each DI provider must set mutli=true`);
            }
            
            existing.factories.push(resolved.factories[0]);
            return;
        }
        
        this._providerByKey.set(resolved.key, resolved);
    }
}