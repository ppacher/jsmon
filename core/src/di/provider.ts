import {Type} from './type';

/**
 * Provides a dependency injection provider using the
 * specified value
 */
export interface ValueProvider {
    /** The token to use for dependency injection */
    provide: any;

    /** The value to use when injected into a class */
    useValue: any;
}

/**
 * Provides a dependency injection provider by
 * creating a new instance of the specified class
 */
export interface ClassProvider {
    /** The token to use for dependency injection */
    provide: any;

    /** The class constructore use to create a new instance */
    useClass: Type<any>;
}

/**
 * Provides a dependency injection provider by invoking
 * the specified factory function passing a list of dependencies
 * (which in turn must be available using dependency injection)
 */
export interface FactoryProvider {
    /** The token to use for dependency injection */
    provide: any;

    /** The factory function that creates the value for injection */
    useFactory: (...args: any[]) => any;
    
    /** A list of dependencies the factory function requires as arguments */
    debs?: any[];
}

/**
 * A simple way to provide a class as a DI provide
 * this is equal to using a ClassProvider and settings
 * the `provide` and `useClass` fields to the same constructor
 * 
 * e.g. {
 *          provide: MyClass,
 *          useClass. MyClass,
 *      } 
 */
export interface TypeProvider extends Type<any> {}

/**
 * Type use to provide a value to the dependecy injector
 */
export type Provider = ValueProvider | ClassProvider | FactoryProvider | TypeProvider;
