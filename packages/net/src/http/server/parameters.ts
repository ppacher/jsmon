import { Type, ForwardRef, makePropDecorator, makeDecorator } from '@jsmon/core';

//
// Definition decorator
//

export interface DefinitionDecorator {
    (): any;
    new (): Definition;
}
export interface Definition{}
export const Definition: DefinitionDecorator = makeDecorator('Definition');

//
// Required decorator
//

export interface RequiredDecorator {
    (): any;
    new (): Required;
}
export interface Required {}
export const Required: RequiredDecorator = makePropDecorator('Required');

export type PrimitiveType = 'number' | 'string' | 'boolean';
export type PropertyType = PrimitiveType | 'array' | 'object';

//
// Property decorator
//

export interface Property {
    type?: PropertyType;
    options?: PropertyOptions;
}

export interface PropertyOptions {
    type?: PropertyType;
    description?: string;
}

export interface ArrayPropertyOptions extends PropertyOptions {
    type?: 'array';
    items: Type<any> | ForwardRef<any> | PrimitiveType;
}

export interface StringPropertyOptions extends PropertyOptions {
    type?: 'string';
    regex?: RegExp;
}

export interface NumberPropertyOptions extends PropertyOptions {
    type?: 'number';
    min?: number;
    max?: number;
}

export interface ObjectPropertyOptions extends PropertyOptions {
    type?: 'object';
    classType: Type<any> | ForwardRef<any>;
}

export interface BooleanPropertyOptions extends PropertyOptions {
    type?: 'boolean';
}

export interface PropertyDecorator {
    (options?: PropertyOptions): any;
    (options?: ArrayPropertyOptions): any;
    (options?: StringPropertyOptions): any;
    (options?: NumberPropertyOptions): any;
    (options?: ObjectPropertyOptions): any;
    
    (type?: Type<any>|ForwardRef<any>, options?: PropertyOptions): any;

    (type?: PropertyType, options?: PropertyOptions): any;
    (type?: 'array', options?: ArrayPropertyOptions): any;
    (type?: 'string', options?: StringPropertyOptions): any;
    (type?: 'number', options?: NumberPropertyOptions): any;
    (type?: 'object', options?: ObjectPropertyOptions): any;
    
    new (options?: PropertyOptions): Property;
    new (options?: ArrayPropertyOptions): Property;
    new (options?: StringPropertyOptions): Property;
    new (options?: NumberPropertyOptions): Property;
    new (options?: ObjectPropertyOptions): Property;
    
    new (type?: Type<any>|ForwardRef<any>, options?: PropertyOptions): Property;
    
    new (type?: PropertyType, options?: PropertyOptions): Property;
    new (type?: 'array', options?: ArrayPropertyOptions): Property;
    new (type?: 'string', options?: StringPropertyOptions): Property;
    new (type?: 'number', options?: NumberPropertyOptions): Property;
    new (type?: 'object', options?: ObjectPropertyOptions): Property;
}

export const Property: PropertyDecorator = makePropDecorator('Property', (type?: any, options?: PropertyOptions|ArrayPropertyOptions) => {
    let propType: PropertyType | undefined;
    let propOptions: any;
    
    if (type === undefined) {
        return {};
    }
    
    if (typeof type === 'function') {
        // it may either be a an array or object
        propOptions = {
            ...(options || {}),
            classType: type,
            items: type,
        }
    } else
    if (typeof type === 'string') {
        // If type is a string, it should hold a valid property type
        propType = type as PropertyType;
        propOptions = options;
    } else
    if (typeof type === 'object') {
        // we did not receive a type but received the property options
        // Instead
        propOptions = type;
    }
    
    return {
        type: propType,
        options: propOptions
    };
});

export interface RouteDefinition {}

//
// Resolved Properties
//
export interface ResolvedBaseProperty {
    type: PropertyType;
    description?: string;
}

export interface ResolvedStringProperty extends ResolvedBaseProperty, StringPropertyOptions {
    type: 'string';
}

export interface ResolvedNumberProperty extends ResolvedBaseProperty, NumberPropertyOptions {
    type: 'number';
}

export interface ResolvedBooleanProperty extends ResolvedBaseProperty, BooleanPropertyOptions {
    type: 'boolean';
}

export interface ResolvedArrayProperty extends ResolvedBaseProperty, ArrayPropertyOptions {
    type: 'array';
    
    itemDefinition: ResolvedProperty | ResolvedPropertyRef;
}

export interface ResolvedPropertyRef {
    ref: string;
}

export interface ResolvedObjectProperty extends ResolvedBaseProperty, ObjectPropertyOptions {
    type: 'object';
    
    name: string;
    
    required: string[];

    properties: {
        [key: string]: ResolvedProperty | ResolvedPropertyRef;
    }
}

export type ResolvedProperty = ResolvedStringProperty
                             | ResolvedBooleanProperty
                             | ResolvedNumberProperty
                             | ResolvedArrayProperty
                             | ResolvedObjectProperty;