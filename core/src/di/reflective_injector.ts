import {Provider} from './provider';
import {ReflectiveKey} from './reflective_key';
import {resolveReflectiveProvider, ResolvedReflectiveProvider, ReflectiveDependency} from './reflective_provider';
import {Self, SkipSelf} from './annotations';

const _THROW_NOT_FOUND = new Object();
const _UNDEFINED = new Object();

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
    
    addProvider(p: Provider|Provider[]): void {
        if (!Array.isArray(p)) {
            p = [p];
        }
        
        this._providers = this._providers.concat(p.map(provider => resolveReflectiveProvider(provider)));
    }
    
    static resolveAndCreate(providers: Provider|Provider[], name: string = ''): ReflectiveInjector {
        const inj = new ReflectiveInjector(null, name);
        inj.addProvider(providers);

        return inj;
    }

    resolveAndCreateChild(providers: Provider|Provider[], name: string = ''): ReflectiveInjector {
        const child = new ReflectiveInjector(this, name);
        child.addProvider(providers);
        
        return child;
    }
    
    get<T>(token: any, notFound: any|null = _THROW_NOT_FOUND): T {
        const key = ReflectiveKey.get(token);
        return this._getByKey(key, null, notFound);
    }
    
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