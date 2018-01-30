import {Type} from './type';

/**
 * Provides a dependency injection provider using the
 * specified value
 */
export interface ValueProvider {
    provide: any;

    useValue: any;
}

/**
 * Provides a dependency injection provider by
 * creating a new instance of the specified class
 */
export interface ClassProvider {
    provide: any;

    useClass: Type<any>;
}

/**
 * Provides a dependency injection provider by invoking
 * the specified factory function passing a list of dependencies
 * (which in turn must be available using dependency injection)
 */
export interface FactoryProvider {
    provide: any;

    useFactory: (...args: any[]) => any;
    
    debs?: any[];
}

export interface TypeProvider extends Type<any> {}

export interface ConstructorProvider {
    provide: Type<any>;
    
    debs?: any[];
}

/**
 * Type use to provide a value to the dependecy injector
 */
export type Provider = ValueProvider | ClassProvider | FactoryProvider | ConstructorProvider | TypeProvider;
