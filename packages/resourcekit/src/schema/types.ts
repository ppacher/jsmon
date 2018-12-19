/** StringType represents a property of type string */
export interface StringType {
    type: 'string';
}

/** NumberType represents a property of type number */
export interface NumberType {
    type: 'number';
}

/** BooleanType represents a property of type boolean */
export interface BooleanType {
    type: 'boolean';
}

/**
 * ListType represents a property of a list type where eace
 * list member must be of a given type
 */
export interface ListType {
    type: 'list';
    
    /** The type definition for the list items */
    items: TypeDefinition;
}

/** ObjectType represents a complex properety type */
export interface ObjectType {
    type: 'object';
    
    /** A list of required property names */
    required?: string[];
    
    /** Supported object properties and their type */
    properties: {
        [propertyName: string]: TypeDefinition
    };
}

export type AnyType = 'any';

/** TypeDefinition is an intersection of all possible property types */
export type TypeDefinition = StringType
                           | NumberType
                           | BooleanType
                           | ListType
                           | ObjectType
                           | AnyType;
                           