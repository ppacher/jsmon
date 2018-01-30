import "reflect-metadata";

import {ReflectiveKey} from './reflective_key';
import {Self, SkipSelf, Inject, Optional} from './annotations';
import {Type} from  './type';
import {PARAMETERS, stringify} from '../utils';
import {
    ClassProvider,
    ConstructorProvider,
    FactoryProvider,
    TypeProvider,
    ValueProvider,
    Provider
} from './provider';

export interface NormalizedProvider extends ClassProvider, FactoryProvider, ValueProvider, TypeProvider {}

export class ReflectiveDependency {
    constructor(public readonly key: ReflectiveKey,
                public optional: boolean,
                public visibility: Self|SkipSelf|null) {}
    
    static fromKey(key: ReflectiveKey): ReflectiveDependency {
        return new ReflectiveDependency(key, false, null);
    }
}

export class ResolvedReflectiveFactory {
    constructor(public factory: Function,
                public dependencies: ReflectiveDependency[]) {}
}

export class ResolvedReflectiveProvider {
    constructor(public key: ReflectiveKey,
                public resolvedFactory: ResolvedReflectiveFactory) {}
}

export function resolveReflectiveProvider(provider: Provider): ResolvedReflectiveProvider {
    let normalized = _normalizeProvider(provider);
    return new ResolvedReflectiveProvider(ReflectiveKey.get(normalized.provide), resolveReflectiveFactory(normalized));
}

export function _normalizeProvider(provider: Provider): NormalizedProvider {
    if (provider instanceof Type) {
        return {
            provide: provider,
            useClass: provider,
        } as NormalizedProvider;
    }
    
    if (typeof provider === 'object' && provider.provide !== undefined) {
        return provider as NormalizedProvider;
    }
    
    throw new Error(`Invalid provider`);
}

export function resolveReflectiveFactory(provider: NormalizedProvider): ResolvedReflectiveFactory {
    let factory: Function;
    let resolvedDeps: ReflectiveDependency[] = [];

    if (provider.useClass) {
        factory = (...args: any[]) => {
            return new provider.useClass(...args);
        };
        resolvedDeps = _getClassDependecies(provider.useClass);
    } else if (provider.useFactory) {
        factory = provider.useFactory;
        resolvedDeps = _parseDependecies(provider.debs || []);
    } else if (provider.useValue) {
        factory = () => provider.useValue;
        resolvedDeps = [];
    }
    
    return new ResolvedReflectiveFactory(factory, resolvedDeps);
}

export function _getClassDependecies(cls: Type<any>): ReflectiveDependency[] {
    let params = Reflect.getMetadata('design:paramtypes', cls);
    
    if (params === undefined || params.length === 0) {
        return [];
    }
    let annotations = Object.getOwnPropertyDescriptor(cls, PARAMETERS);
    
    let metadata = annotations ? annotations.value : new Array(params.length).fill([]);
    
    return _zipParametersAndAnnotations(params, metadata);
}

export function _parseDependecies(debs: any[]): ReflectiveDependency[] {
    let resolved: ReflectiveDependency[] = [];

    debs.forEach(dependency => {
        if (Array.isArray(dependency)) {
            const token = dependency[dependency.length -1];
            const annotations = dependency.slice(0, dependency.length -1);
            let r = _zipParametersAndAnnotations([token], [annotations]);
            resolved.push(r[0]);
            
        } else {
            // TODO(ppacher): check for duplicates
            resolved.push(ReflectiveDependency.fromKey(ReflectiveKey.get(dependency)));
        }
    });
    
    return resolved;
}

export function _zipParametersAndAnnotations(params: any[], annotations: any[][]): ReflectiveDependency[] {
    let debs: ReflectiveDependency[] = [];
    
    for(let i = 0; i < params.length; i++) {
        let token = params[i];
        let skipSelf = annotations[i].find(m => m instanceof SkipSelf);
        let self = annotations[i].find(m => m instanceof Self);
        let visibility: Self | SkipSelf | null = null;
        
        if (!!self && !!skipSelf) {
            throw new Error(`invalid annotation for parameter ${stringify(token)}`);
        }
        
        if (!!self) {
            visibility = self;
        }
        
        if (!!skipSelf) {
            visibility = skipSelf;
        }


        let inject: Inject = annotations[i].find(m => m instanceof Inject);
        if (inject !== undefined) {
            token = inject.token;
        }

        let optional = annotations[i].find(m => m instanceof Optional) !== undefined;
        
        debs.push(new ReflectiveDependency(ReflectiveKey.get(token), optional, visibility));
    }

    return debs;
}