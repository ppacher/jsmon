import { ObjectType } from "./types";

/** Metadata holds additional metadata for resources */
export interface Metadata {
    [key: string]: string;
}

export interface Resource<T> {
    /** The API version of the schema */
    apiVersion: string;
    
    /** The kind of resource managed */
    kind: string;
    
    /** An optional metadata for the resource */
    metadata?: Metadata;
    
    /** The definition of the schema resource */
    spec: T;
}

export interface Schema {
    /** The supported API version */
    apiVersion: string;

    /** The kind of resource supported */
    kind: string;

    /** The object type definition for the resource */
    specDefinition: ObjectType;
}
