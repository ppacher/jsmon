import { ResolvedProperty, ResolvedPropertyRef } from "./parameters";
import { Use, Get, Post, Put, Patch, Delete, RequestSettings } from './annotations';
import { Type, PROP_METADATA, isType } from "@jsmon/core";
import { DefinitionResolver } from "./parameter-internals";

export interface BoundRequestSettings extends  RequestSettings {
    middleware: Use[];
    propertyKey: string;
    parameters: {
        [key: string]: ResolvedProperty;
    },
    body?: ResolvedProperty | ResolvedPropertyRef;
}

export function getAnnotations(cls: Type<any>, resolver: DefinitionResolver): BoundRequestSettings[] {
    const annotations = Reflect.getOwnPropertyDescriptor(cls, PROP_METADATA);
    const settings: BoundRequestSettings[] = [];
    if (annotations === undefined) {
        return settings;
    } 
    
    Object.keys(annotations.value)
        .forEach(key => {
            const verbs: RequestSettings[] = annotations.value[key].filter((a: any) => {
                return a instanceof Get ||
                       a instanceof Post ||
                       a instanceof Put ||
                       a instanceof Patch ||
                       a instanceof Delete;
            });
            
            const middlewares: Use[] = annotations.value[key].filter((a: any) => a instanceof Use);

            if (verbs.length === 0) { return; }
            
            verbs.forEach(setting => {
                let parameters: {
                    [key: string]: ResolvedProperty;
                } = {};
                let bodyDef: any;

                if (setting.definition) {
                    Object.keys(setting.definition.parameters || {})
                        .forEach(parameterName => {
                            const def = setting.definition!.parameters![parameterName];
                            let resolved: any;

                            if (typeof def === 'string') {
                                resolved = {
                                    type: def,
                                }
                            } else {
                                resolved = def;
                            }
                            
                            parameters[parameterName] = resolved;
                        });
                        
                    if (setting.definition.body) {
                        const body = setting.definition.body;
                        if (typeof body === 'string') {
                            bodyDef = {
                                type: body
                            }
                        } else
                        if (isType(body)) {
                            bodyDef = resolver.resolve(body);
                        } else {
                            bodyDef = body;
                        }
                    }
                }
                
                settings.push({
                    ...setting,
                    propertyKey: key,
                    middleware: middlewares,
                    parameters: parameters,
                    body: bodyDef,
                });
            });
        });

    return settings;
}