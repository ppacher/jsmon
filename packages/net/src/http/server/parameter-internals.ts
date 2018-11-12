import { ANNOTATIONS, ForwardRef, isType, PROP_METADATA, resolveForwardRef, Type } from "@jsmon/core";
import { ArrayPropertyOptions, BooleanPropertyOptions, Definition, NumberPropertyOptions, ObjectPropertyOptions, Property, PropertyType, Required, ResolvedArrayProperty, ResolvedBooleanProperty, ResolvedNumberProperty, ResolvedObjectProperty, ResolvedProperty, ResolvedPropertyRef, ResolvedStringProperty, StringPropertyOptions } from "./parameters";

export class DefinitionResolver {
    private static defaultResolver: DefinitionResolver;
    
    /**
     * Returns the default (global) definition resolver
     */
    static get default(): DefinitionResolver {
        if (!this.defaultResolver) {
            this.defaultResolver = new DefinitionResolver();
        }
        
        return this.defaultResolver;
    }
    
    private readonly _definitionCache: Map<string, ResolvedProperty> = new Map();
    
    /**
     * Returns a resolved definition from the cache. If no such definition is
     * available, undefined is returend
     * 
     * @param what - The class type or the name of the definition to search for
     */
    get(what: Type<any>|string): ResolvedProperty | undefined {
        if (isType(what)) {
            what = what.name;
        }
        
        return this._definitionCache.get(what);
    }

    /**
     * Resolves a class type or forward ref and returns a resolved
     * definition
     * 
     * @param what - The class type (or a forward ref) to resolve
     */
    resolve(what: Type<any> | ForwardRef<any>): ResolvedProperty {
        let target = resolveForwardRef(what);

        if (this._definitionCache.has(target.name)) {
            return this._definitionCache.get(target.name)!;
        }

        return this._resolveType(resolveForwardRef(what), {});
    }
    
    /**
     * @internal
     * 
     * Dumps all available definitions
     */
    dump(): void {
        this._definitionCache.forEach((type, name) => {
            console.log(name, '\n', type);
        });
    }

    /**
     * @internal
     * 
     * Dumps all available definitions from the global default resolver
     */
    static dump() {
        if (!this.defaultResolver) {
            return;
        }
        
        this.defaultResolver.dump();
    }
    
    /**
     * Resolves a class type or forward ref and returns a resolved
     * definition using the global default resolver
     * 
     * @param what - The class type (or a forward ref) to resolve
     */
    static resolve(what: Type<any> | ForwardRef<any>): ResolvedProperty {
        if (!this.defaultResolver) {
            this.defaultResolver = new DefinitionResolver();
        }
        
        return this.defaultResolver.resolve(what);
    }
    
    private _resolveType(type: any, property: Property): ResolvedProperty {
        let resolvedType: PropertyType;
        if (!!property.type) {
            resolvedType = property.type;
        } else {
            if (!!type) {
                resolvedType = typeFrom(type);
            } else {
                throw new Error(`Cannot resolve type without a type definition`);
            }
        }
        
        switch (resolvedType) {
            case 'string':
                return this._resolveStringType(property, property.options as StringPropertyOptions)
            case 'number':
                return this._resolveNumberType(property, property.options as NumberPropertyOptions);
            case 'boolean':
                return this._resolveBooleanType(property, property.options as BooleanPropertyOptions);
            case 'array':
                return this._resolveArrayType(property, property.options as ArrayPropertyOptions);
            case 'object':
            default:
                return this._resolveObjectType(property, type, property.options as ObjectPropertyOptions);
        }
        
        throw new Error(`Invalid property type: ${resolvedType}`);
    }

    private _resolveStringType(prop: Property, options?: StringPropertyOptions): ResolvedStringProperty {
        return {
            ...(options || {}),
            type: 'string',
        }
    }
    
    private _resolveNumberType(prop: Property, options?: NumberPropertyOptions): ResolvedNumberProperty {
        return {
            ...(options || {}),
            type: 'number',
        }
    }

    private _resolveBooleanType(prop: Property, options?: BooleanPropertyOptions): ResolvedBooleanProperty {
        return {
            ...(options || {}),
            type: 'boolean'
        }
    }

    private _resolveArrayType(prop: Property, options?: ArrayPropertyOptions): ResolvedArrayProperty {
        if (!options) {
            throw new Error(`Property options for array missing`);
        }
        
        let itemType: PropertyType;

        if (typeof options.items === 'string') {
            itemType = options.items;
        } else {
            itemType = 'object';
        }
        
        let itemDefintion: ResolvedProperty | ResolvedPropertyRef = this._resolveType(options.items, {type: itemType});
        
        if (itemDefintion.type === 'object') {
            itemDefintion = {
                ref: itemDefintion.name
            };
        }

        return {
            ...(options || {}),
            type: 'array',
            itemDefinition: itemDefintion
        }
    }
    
    private _resolveObjectType(prop: Property, what: Type<any>, options?: ObjectPropertyOptions): ResolvedObjectProperty {
        if (!!options && !!options.classType) {
            what = resolveForwardRef(options.classType);
        }
        
        if (this._definitionCache.has(what.name)) {
            return this._definitionCache.get(what.name)! as ResolvedObjectProperty;
        }
        
        const propertyAnnotations = Reflect.getOwnPropertyDescriptor(what, PROP_METADATA);
        const definitionAnnotations = Reflect.getOwnPropertyDescriptor(what, ANNOTATIONS);

        if (!definitionAnnotations || !definitionAnnotations.value) {
            throw new Error(`No definition annotation for ${what.name}. Did you forget to use the @Definition() decorator?`);
        }
        const definition: Definition = definitionAnnotations.value.find((d: any) => d instanceof Definition);
        if (!definition) {
            throw new Error(`No definition annotation for ${what.name}. Did you forget to use the @Definition() decorator?`);
        }
    
        if (!propertyAnnotations || !propertyAnnotations.value) {
            throw new Error(`No property definitions for ${what.name}. Did you forget to use the @Property() decorator?`);
        }
        
        let result: ResolvedObjectProperty = {
            ...(options || {}),
            type: 'object',
            name: what.name,
            required: [],
            properties: {},
            classType: what,
        };
        
        if (!!definition.description) {
            result.description = definition.description;
        }
 
        Object.keys(propertyAnnotations.value)
            .forEach(propertyKey => {
                const annotations: any[] = propertyAnnotations.value[propertyKey];
                const propertyDefinition: Property | undefined = annotations.find(a => a instanceof Property);
                const propertyType = Reflect.getMetadata('design:type', what.prototype, propertyKey);
                const isRequired = annotations.some(a => a instanceof Required);
                
                if (!propertyDefinition) {
                    throw new Error(`No @Property() decorator for ${what.name}.${propertyKey}.`);
                }
                
                let def: ResolvedProperty | ResolvedPropertyRef = this._resolveType(propertyType, propertyDefinition);
                
                if (def.type === 'object') {
                    def = {
                        ref: def.name
                    }
                }
                
                result.properties[propertyKey] = def;
                
                if (isRequired) {
                    result.required.push(propertyKey);
                }
            });
            
        this._definitionCache.set(what.name, result);

        return result;
    }
}


function typeFrom(value: any): PropertyType {
    switch (value) {
    case Boolean:
        return 'boolean';
    case String:
        return 'string';
    case Number:
        return 'number';
    case Array:
        return 'array';
    case Object:
    default:
        return 'object';
    }
}