import "reflect-metadata";

import {ProviderKey} from './key';
import {Self, SkipSelf, Inject, Injectable, Optional} from './annotations';
import {ANNOTATIONS, PARAMETERS} from '../utils/decorator';
import {Provider, ClassProvider, FactoryProvider, TypeProvider, ValueProvider, ExistingProvider} from './provider';
import {Type, isType} from './type';
import {resolveForwardRef} from './forward_ref';

export type NormalizedProvider = ClassProvider<any> | FactoryProvider<any> | ValueProvider<any> | ExistingProvider<any>;

export class ResolvedProvider<T> {
    constructor(public readonly key: ProviderKey, 
                public readonly factories: ResolvedFactory<T>[],
                public readonly multi: boolean) {
    }
}

export class ResolvedFactory<T> {
    constructor(public readonly factory: (...args: any[]) => T,
                public readonly dependencies: ResolvedDependency[]) {}
}

export class ResolvedDependency {
    constructor(public readonly key: ProviderKey,
                public readonly optional: boolean = false,
                public visibility: 'self'|'skipself'|null = null) {}
    
    static fromKey(key: ProviderKey): ResolvedDependency {
        return new ResolvedDependency(key);
    }

    toString(): string {
        return `ResolvedDependency<${this.key.displayName}>`;
    }
}

export function resolveProvider<T>(p: Provider<T>): ResolvedProvider<T> {
    const n = normalizeProvider(p);
    const key = ProviderKey.get(resolveForwardRef(n.provide));
    let deps: ResolvedDependency[] = [];
    let factory: (...args: any[]) => any;
    let multi = n.multi === true;

    if (isValueProvider(n)) {
        factory = (...args: any[]) => n.useValue;
    } else
    if (isFactoryProvider(n)) {
        factory = n.useFactory;
        deps = _resolveDependecies(n.debs || []);
    } else
    if (isClassProvider(n)) {
        const useClass = resolveForwardRef(n.useClass);
        factory = (...args: any[]) => new useClass(...args);
        
        deps = _getClassDependecies(n.useClass);
    } else
    if (isExistingProvider(n)) {
        factory = (...args: any[]) => args[0];
        const depKey = ProviderKey.get(resolveForwardRef(n.useExisting));

        deps = [new ResolvedDependency(depKey)];
    } else {
        throw Error(`Invalid provider`);
    }
    
    return new ResolvedProvider(key, [new ResolvedFactory(factory, deps)], multi);
}

function _resolveDependecies(deps: any[]): ResolvedDependency[] {
    // TODO: factories don't yet support @Inject, @Optional, ...
    return deps.map(d => ResolvedDependency.fromKey(resolveForwardRef(ProviderKey.get(d))));
}

function _getClassDependecies(cls: Type<any>): ResolvedDependency[] {
    let params = Reflect.getMetadata('design:paramtypes', cls);
    
    if (params === undefined || params.length === 0) {
        return [];
    }
    let annotations = Object.getOwnPropertyDescriptor(cls, PARAMETERS);
    
    
    let metadata = annotations ? annotations.value : new Array(params.length).fill([]);
    
    return _zipParametersAndAnnotations(params, metadata);
}

function _zipParametersAndAnnotations(params: any[], annotations: any[][]): ResolvedDependency[] {
    let debs: ResolvedDependency[] = [];
    
    for(let i = 0; i < params.length; i++) {
        let token = params[i];
        let optional = false;
        let visibility: 'self'|'skipself'|null = null;
        
        if (!!annotations[i]) {
            let inject: Inject = annotations[i].find(m => m instanceof Inject);
            if (inject !== undefined) {
                token = inject.token;
            }
        
            optional = annotations[i].find(m => m instanceof Optional) !== undefined;

            let self = annotations[i].find(m => m instanceof Self) !== undefined;
            let skipSelf = annotations[i].find(m => m instanceof SkipSelf) !== undefined;
            
            if (self && skipSelf) {
                throw new Error(`@Self() and @SkipSelf() cannot be used together`);
            }
            
            if (self) {
                visibility = 'self';
            }
            
            if (skipSelf) {
                visibility = 'skipself';
            }
        }

        token = resolveForwardRef(token);

        
        debs.push(new ResolvedDependency(ProviderKey.get(token), optional, visibility));
    }

    return debs;
}

export function normalizeProvider(p: Provider): NormalizedProvider {
    if (isTypeProvider(p)) {
        // Type providers itself can never be multi-providers
        return {
            provide: p,
            useClass: p,
            multi: false,
        };
    }
    
    return p;
}

function isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
    return !!(provider as any).useClass;
}

function isFactoryProvider<T = any>(provider: Provider<T>): provider is FactoryProvider<T> {
    return !!(provider as any).useFactory;
}

function isExistingProvider<T = any>(provider: Provider<T>): provider is ExistingProvider<T> {
    return !!(provider as any).useExisting;
}

function isValueProvider<T = any>(provider: Provider<T>): provider is ValueProvider<T> {
    return !!(provider as any).useValue;
}

function isTypeProvider<T = any>(provider: Provider<T>): provider is TypeProvider<T> {
    return isType(provider);
}