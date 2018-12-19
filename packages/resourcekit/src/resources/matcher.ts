import { NumberType, BooleanType, ObjectType, TypeDefinition, StringType, ListType } from "../schema";

export interface ResourceFilter<T> {
    /** The API version of the resource */
    apiVersion: string;
    
    /** The ID of the resource instance if known */
    id?: string;
    
    /** The kind of resource */
    kind: string;

    /** Partial filter properties */
    spec: Partial<T>;
}

export namespace Matcher {
    /**
     * Matches a resource string value against an expecated value
     * 
     * @param expected - The value to match against
     * @param value - The actual value of the resource
     * @param type - The type definition
     */
    export function matchString(expected: string, value: string, type: StringType): boolean {
        return expected === value;
    }
    
    /**
     * Matches a resource number value against an expected value
     * 
     * @param expected - The value to match against
     * @param value - The actual value of the resource
     * @param type - The type definition
     */
    export function matchNumber(expected: number, value: number, type: NumberType): boolean {
        return expected === value;
    }
    
    /**
     * Matches a resources boolean value against an expected value
     * 
     * @param expected - The value to match against
     * @param value - THe actual value of the resource
     * @param type - The type definition
     */
    export function matchBoolean(expected: boolean, value: boolean, type: BooleanType): boolean {
        return expected === value;
    }
    
    export function matchObject(expected: any, value: any, type: ObjectType): boolean {
        const expectedProperties = Object.keys(expected);

        for(let i = 0; i < expectedProperties.length; i++) {
            const propertyName = expectedProperties[i];
            const expectedValue = expected[propertyName];
            const propTypeDefinition = type.properties[propertyName];

            if (!propTypeDefinition) {
                return false;
            }
           
            if (!match(expectedValue, value[propertyName], propTypeDefinition)) {
                return false;
            }
        }
        return true;
    }
    
    export function matchList(expected: any[], value: any[], type: ListType): boolean {
        console.warn(`Matching against lists is not yet implemented`);
        // How should we match lists?
        return true;
    }
    
    export function match(expected: any, value: any, type: TypeDefinition): boolean {
        if (type === 'any') {
            return expected === value;
        }
        
        switch (type.type) {
        case 'boolean':
            return matchBoolean(expected, value, type);
        case 'string':
            return matchString(expected, value, type);
        case 'number':
            return matchNumber(expected, value, type);
        case 'object':
            return matchObject(expected, value, type);
        case 'list':
            return matchList(expected, value, type);
        }

        return true;
    }
}