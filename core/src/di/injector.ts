import {ResolvedDependency, ResolvedProvider, resolveProvider} from './resolved_provider';
import {ProviderKey} from './key';
import {Provider} from './provider';
import {Type} from './type';

const _UNDEFINED = new Object();
const _THROW_NOT_FOUND = new Object();

export class Injector {
    private static _INJECTOR_KEY = ProviderKey.get(Injector);
    private _providers: Map<ProviderKey, ResolvedProvider<any>> = new Map<ProviderKey, ResolvedProvider<any>>();
    private _instances: Map<ProviderKey, any> = new Map<ProviderKey, any>(); 
    
    constructor(private parent?: Injector) {}
    
    public provide(p: Provider): void {
        const resolved = resolveProvider(p);

        if (this._providers.has(resolved.key)) {
            return;
        }
        
        this._providers.set(resolved.key, resolved);
    }
    
    public get<T>(token: Type<T>|any, notFound: any = _THROW_NOT_FOUND): T {
        let key = ProviderKey.get(token);

        return this._getByKeyBubble(key, notFound);
    }
    
    _getByKey<T>(key: ProviderKey, notFound: any): T {
        if (key === Injector._INJECTOR_KEY) {
            return this as any;
        }

        const provider = this._providers.get(key);
        
        if (provider === undefined) {
            if (notFound !== _THROW_NOT_FOUND) {
                return notFound;
            }

            throw new Error(`No provider for ${key}`);
        }
        
        if (this._instances.has(key)) {
            return this._instances.get(key)!;
        }

        return this._instantiate(provider);
    }
    
    _getByKeyBubble<T>(key: ProviderKey, notFound: any): T {
        let inj: Injector|undefined = this;

        while(inj instanceof Injector && !!inj) {
            let instance = inj._getByKey<T>(key, _UNDEFINED);

            if (instance !== _UNDEFINED) {
                return instance;
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
    
    _instantiate<T>(p: ResolvedProvider<T>): T {
        let deps = p.dependencies.map(d => this._getByResolvedDependency(d));
        
        if (deps.some((d, index) => d === _UNDEFINED && p.dependencies[index].optional === false)) {
            let args: string[] = p.dependencies.map((dep, index) => {
                if (deps[index] !== _UNDEFINED) {
                    return dep.key.displayName;
                }
                return `${dep.key.displayName}?`;
            });
            
            throw new Error(`Cannot create ${p.key.displayName}(${args.join(', ')})`);
        }
        
        // at this point, all _UNDEFINED dependencies are optional and need to be replaced
        deps = deps.map(d => d === _UNDEFINED ? undefined : d);

        const instance = p.factory(...deps);

        this._instances.set(p.key, instance);

        return instance;
    }

    _getByResolvedDependency(dep: ResolvedDependency): any {
        if (this._instances.has(dep.key)) {
            return this._instances.get(dep.key);
        }
        
        return this._getByKeyBubble(dep.key, _UNDEFINED);
    }
    
    toString(): string {
        let s = Array.from(this._providers.values()).map(p => p.key.displayName).join(', ');
        
        return `Injector(providers=${s})`;
    }
}