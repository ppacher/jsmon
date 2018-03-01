import "reflect-metadata";

import {ProviderKey} from './key';
import {Inject, Injectable, Optional} from './annotations';
import {ANNOTATIONS, PARAMETERS} from '../utils/decorator';
import {Provider, ClassProvider, FactoryProvider, TypeProvider, ValueProvider, ExistingProvider} from './provider';
import {Type, isType} from './type';
import {resolveForwardRef} from './forward_ref';

export interface NormalizedProvider extends ClassProvider<any>, FactoryProvider<any>, ValueProvider<any>, ExistingProvider<any> {};

export class ResolvedProvider<T> {
    constructor(public readonly key: ProviderKey, 
                public readonly factory: (...args: any[]) => T,
                public readonly dependencies: ResolvedDependency[]) {
    }
}

export class ResolvedDependency {
    constructor(public readonly key: ProviderKey,
                public readonly optional: boolean = false) {}
    
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

    if (n.useValue) {
        factory = (...args: any[]) => n.useValue;
    } else
    if (n.useFactory) {
        factory = n.useFactory;
        deps = _resolveDependecies(n.debs || []);
    } else
    if (n.useClass) {
        const useClass = resolveForwardRef(n.useClass);
        factory = (...args: any[]) => new useClass(...args);
        
        deps = _getClassDependecies(n.useClass);
    } else
    if (n.useExisting) {
        factory = (...args: any[]) => args[0];
        const depKey = ProviderKey.get(resolveForwardRef(n.useExisting));

        deps = [new ResolvedDependency(depKey)];
    } else {
        throw Error(`Invalid provider`);
    }
    
    return new ResolvedProvider(key, factory, deps);
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
        
        if (!!annotations[i]) {
            let inject: Inject = annotations[i].find(m => m instanceof Inject);
            if (inject !== undefined) {
                token = inject.token;
            }
        
            optional = annotations[i].find(m => m instanceof Optional) !== undefined;
        }

        token = resolveForwardRef(token);

        
        debs.push(new ResolvedDependency(ProviderKey.get(token), optional));
    }

    return debs;
}

export function normalizeProvider(p: Provider): NormalizedProvider {
    let n: NormalizedProvider;
    
    if (isType(p)) {
        n = {
            provide: p,
            useClass: p,
        } as NormalizedProvider;
    } else {
        n = p as NormalizedProvider;
    }
    
    return n;
}