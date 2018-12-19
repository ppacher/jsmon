import { Schema, Resource } from "./schema";
import { BooleanType, NumberType, StringType, TypeDefinition, ListType, ObjectType } from "./types";

export namespace Validator {
    export namespace Errors {
        /**
         * InvalidTypeError is returned if a different type is expected
         */
        export class InvalidTypeError extends Error {
            constructor(expected: string, val: any) {
                super(`Expected ${expected} but got ${typeof val}`);
                this.name = `InvalidTypeError: ` 
            }
        }

        /**
         * MissingRequiredPropertyError is returned if a required object property is missing
         */
        export class MissingRequiredPropertyError extends Error {
            constructor(property: string) {
                super(`Property ${property} is missing`);
                this.name = 'MissingRequiredPropertyError';
            }
        }

        /**
         * UnknownPropertyError is returned if an unknown object property is encountered
         */
        export class UnknownPropertyError extends Error {
            constructor(property: string) {
                super(`Unknown property ${property}`);
                this.name = 'UnknownPropertyError';
            }
        }
        
        /**
         * InvalidAPIVersionError is returned if the apiVersion of a schema does not match the resource
         */
        export class InvalidAPIVersionError extends Error {
            constructor(expected: string, value: string) {
                super(`Expected apiVersion ${expected} but got ${value}`);
                this.name = 'InvalidAPIVersionError';
            }
        }
        
        /**
         * InvalidKindError is returned if the kind of a schema does not match the resource
         */
        export class InvalidKindError extends Error {
            constructor(expected: string, value: string) {
                super(`Expected resource kind ${expected} but got ${value}`);
                this.name = 'InvalidKindError';
            }
        }
        
        /**
         * InvalidSchemaError is returned if the given schema is invalid
         */
        export class InvalidSchemaError extends Error {
            constructor(msg: string) {
                super(msg);
                this.name = 'InvalidSchemaError';
            }
        }
    }

    /**
     * Validates an object against a schema definition
     * 
     * @param obj - The object to validate against the schema
     * @param schema - The schema definition used for the validation
     */
    export function validate<T>(obj: Resource<T>, schema: Schema): Error | null {
        if (obj.apiVersion !== schema.apiVersion) {
            return new Errors.InvalidAPIVersionError(schema.apiVersion, obj.apiVersion);
        }

        if (obj.kind !== schema.kind) {
            return new Errors.InvalidKindError(schema.kind, obj.kind);
        }

        if (schema.specDefinition.type !== 'object') {
            return new Errors.InvalidSchemaError(`Expected specDefinition to be an ObjectType`)
        }

        return validateType(obj.spec, schema.specDefinition);
    }
    
    /**
     * Validates if a given value matches a boolean type definition
     * 
     * @param val - The value
     * @param schema - The type definition
     */
    export function validateBoolean(val: any, schema: BooleanType): Error | null {
        if (typeof val !== 'boolean') {
            return new Errors.InvalidTypeError('boolean', val);
        }
        
        return null;
    }
    
    /**
     * Validates if a given value matches a number type definition
     * 
     * @param val - The value
     * @param schema - The number type definition
     */
    export function validateNumber(val: any, schema: NumberType): Error | null {
        if (typeof val !== 'number') {
            return new Errors.InvalidTypeError('number', val);
        }
        
        return null;
    }
    
    /**
     * Validates if a given value matches a string type definition
     * 
     * @param val - The value
     * @param schema - The string type definition
     */
    export function validateString(val: any, schema: StringType): Error | null {
        if (typeof val !== 'string') {
            return new Errors.InvalidTypeError('string', val);
        }
        
        return null;
    }

    /**
     * Validates if a given value matches a list type definition
     * 
     * @param val - The value
     * @param schema - The list type definition
     */
    export function validateList(val: any, schema: ListType): Error | null {
        if (!Array.isArray(val)) {
            return new Errors.InvalidTypeError('list', val);
        }
        
        for( let i = 0; i < val.length; i++ ) {
            let itemError = validateType(val[i], schema.items);
            
            if (itemError != null) {
                return itemError;
            }
        }
        
        return null;
    }
    
    /**
     * Validates if a given value matches an object type definition
     * 
     * @param val - The value
     * @param schema - The object type definition
     */
    export function validateObject(val: any, schema: ObjectType): Error | null {
        if (typeof val !== 'object') {
            return new Errors.InvalidTypeError('object', val);
        }
        
        try {
            (schema.required || []).forEach(property => {
                if (val[property] === undefined) {
                   throw new Errors.MissingRequiredPropertyError(property);
                }
            });
            
            Object.keys(schema.properties).forEach(property => {
                const value = val[property];
                if (value === undefined) {
                    return;
                }
                
                const propertyError = validateType(value, schema.properties[property]);
                if (propertyError !== null) {
                    throw propertyError;
                }
            });
            
            const allowedProperties = Object.keys(schema.properties);

            Object.keys(val).forEach(propertyName => {
                if (!allowedProperties.includes(propertyName)) {
                    throw new Errors.UnknownPropertyError(propertyName);
                }
            })
        } catch (err) {
            return err;
        }
        
        return null;
    }
    
    /**
     * Validates a given value against a type definition
     * 
     * @param val - The value
     * @param schema - The type definition
     */
    export function validateType(val: any, schema: TypeDefinition): Error | null {
        if (schema === 'any') {
            return null;
        }
        
        switch (schema.type) {
            case 'string':
                return validateString(val, schema);
            case 'object':
                return validateObject(val, schema);
            case 'number':
                return validateNumber(val, schema);
            case 'list':
                return validateList(val, schema);
            case 'boolean':
                return validateBoolean(val, schema);
        }
        
        throw new Error(`Unsupported type definition`)
    }
}

export default Validator;