import { Type, ForwardRef, makePropDecorator, makeDecorator } from '@jsmon/core';

//
// Definition decorator
//

/**
 * The type of the Definition decorator
 */
export interface DefinitionDecorator {
    /**
     * Decorates a class as a request/response definition
     * 
     * @param [description] - An optional description for the definition
     */
    (description?: string): any;
    
    /**
     * Decorates a class as a request/response definition
     * 
     * @param [description] - An optional description for the definition
     */
    new (description?: string): Definition;
}

/**
 * The type of returned by the Definition decorator
 */
export interface Definition{
    /** An optional description for the definition */
    description?: string;
}

/**
 * The Definition decorator {@see DefinitionDecorator}.
 * 
 * It is used to mark a class as a request/response definition object
 */
export const Definition: DefinitionDecorator = makeDecorator('Definition', description => ({description}));

//
// Required decorator
//

/**
 * The type of the Required decorator
 */
export interface RequiredDecorator {
    (): any;
    new (): Required;
}

/** The type returned by the Required decorator */
export interface Required {}

/**
 * The Required decorator
 * Used to mark a defintion property as required
 */
export const Required: RequiredDecorator = makePropDecorator('Required');

/**
 * Primitive request types that may be used in request path parameters
 */
export type PrimitiveType = 'number' | 'string' | 'boolean';

/**
 * All possible property types for request and response bodies
 */
export type PropertyType = PrimitiveType | 'array' | 'object';

//
// Property decorator
//

/**
 * Type returned by the Property deocrator
 */
export interface Property {
    /** The type of the decorator property */
    type?: PropertyType;
    
    /**
     * Additional options for the decorated type. The actual
     * type for this property depends on the property type
     */
    options?: PropertyOptions;
}

/** Additional options for definition properties */
export interface PropertyOptions {
    /** The type of the decorated property. Mainly used for type-safety */
    type?: PropertyType;
    description?: string;
}

/**
 * Property options for array properties
 */
export interface ArrayPropertyOptions extends PropertyOptions {
    type?: 'array';
    
    /** The type of the array items */
    items?: Type<any> | ForwardRef<any> | PrimitiveType;
}

/**
 * Property options for string properties
 */
export interface StringPropertyOptions extends PropertyOptions {
    type?: 'string';
    
    /** A regex used to validate the value */
    regex?: RegExp;
}

/**
 * Property options for number properties
 */
export interface NumberPropertyOptions extends PropertyOptions {
    type?: 'number';
    
    /** The minimum value allowed */
    min?: number;
    
    /** The maximum value allowed */
    max?: number;
}

/**
 * Property options for object properties
 */
export interface ObjectPropertyOptions extends PropertyOptions {
    type?: 'object';
    
    /** The class type of the object */
    classType?: Type<any> | ForwardRef<any>;
}

/**
 * Property options for boolean properties
 */
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
        propType = 'object';
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
        propType = propOptions.type;
    }
    
    return {
        type: propType,
        options: propOptions
    };
});

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

export function isPropertyRef(val: any): val is ResolvedPropertyRef {
    return (!!val && typeof val.ref === 'string');
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

export interface RouteDefinition {
    /** A description for the route */
    description?: string;
    
    /** Route parameter definitions */
    parameters?: {
        [key: string]: PrimitiveType |
                       ResolvedStringProperty | 
                       ResolvedNumberProperty | 
                       ResolvedBooleanProperty;
    }
    
    /** The expected body type */
    body?: PropertyType |
           Type<any> |
           ForwardRef<any> |
           ResolvedStringProperty |
           ResolvedNumberProperty |
           ResolvedBooleanProperty |
           ResolvedArrayProperty |
           ResolvedObjectProperty;
}