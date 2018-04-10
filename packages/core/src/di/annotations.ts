import {makeDecorator, makeParamDecorator} from '../utils/decorator';

/**
 * Type for the @Injectable decorator
 */
export interface InjectableDecorator {
    (): any;
    new (): Injectable;
}

/**
 * Type of the Injectable metadata
 */
export interface Injectable {};

/**
 * Injectable decorator
 */
export const Injectable: InjectableDecorator = makeDecorator('Injectable');

/**
 * Type for the @Inject decorator
 */
export interface InjectDecorator {
    (token: any): any;
    new (token: any): Inject;
};

/**
 * Type for the Inject metadata
 */
export interface Inject {
    token: any;
};

/**
 * Inject decorator
 */
export const Inject: InjectDecorator = makeParamDecorator('Inject', (token) => ({token}));

/**
 * Type for the @Optional() decorator
 */
export interface OptionalDecorator {
    (): any;
    new (): Optional;
}

/**
 * Type for the Optional metadata
 */
export interface Optional {};

/**
 * Optional decorator
 */
export const Optional: OptionalDecorator = makeParamDecorator('Optional');


export interface SkipSelfDecorator {
    (): any;
    new (): SkipSelf;
}

export interface SkipSelf {};

export const SkipSelf: SkipSelfDecorator = makeParamDecorator('SkipSelf');

export interface SelfDecorator {
    (): any;
    new (): Self;
}

export interface Self {};

export const Self: SelfDecorator = makeParamDecorator('Self');