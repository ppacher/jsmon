import {Type} from './type';
import {Token} from './token';

export interface BaseToken {
    provide: Token<any>;
    debs?: Token<any>[]|any[][];
}

/**
 * Provides a dependency injection provider using the
 * specified value
 */
export interface ValueProvider extends BaseToken {
    useValue: any;
}

/**
 * Provides a dependency injection provider by
 * creating a new instance of the specified class
 */
export interface ClassProvider extends BaseToken {
    useClass: Type<any>;
}

/**
 * Provides a dependency injection provider by invoking
 * the specified factory function passing a list of dependencies
 * (which in turn must be available using dependency injection)
 */
export interface FactoryProvider extends BaseToken {
    useFactory: (...args: any[]) => any;
}

/**
 * Type use to provide a value to the dependecy injector
 */
export type Provider = ValueProvider | ClassProvider | FactoryProvider | Type<any>;
