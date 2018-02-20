import {Type} from './type';

export interface ValueProvider<T> {
    provide: any;
    
    useValue: T;
};

export interface ClassProvider<T> {
    provide: any;
    
    useClass: Type<T>;
}

export interface FactoryProvider<T> {
    provide: any;

    useFactory: (...args: any[]) => T
    
    debs?: any[];
}

export interface ExistingProvider<T> {
    provide: any;

    useExisting: any;
}

export interface TypeProvider<T> extends Type<T> {};

export type Provider<T = any> = ValueProvider<T> | ClassProvider<T> | FactoryProvider<T> | TypeProvider<T> | ExistingProvider<T>;