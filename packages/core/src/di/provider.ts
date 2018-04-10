import {Type} from './type';

export interface ValueProvider<T> {
    provide: any;
    
    useValue: T;

    multi?: boolean;
};

export interface ClassProvider<T> {
    provide: any;
    
    useClass: Type<T>;
    
    multi?: boolean;
}

export interface FactoryProvider<T> {
    provide: any;

    useFactory: (...args: any[]) => T
    
    debs?: any[];
    
    multi?: boolean;
}

export interface ExistingProvider<T> {
    provide: any;

    useExisting: any;
    
    multi?: boolean;
}

export interface TypeProvider<T> extends Type<T> {};

export type Provider<T = any> = ValueProvider<T> | ClassProvider<T> | FactoryProvider<T> | TypeProvider<T> | ExistingProvider<T>;