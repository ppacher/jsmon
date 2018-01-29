import {makeDecorator, makeParamDecorator} from '../utils/decorator';
import {Token} from './token';

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
 * Type for the @Self decorator
 */
export interface SelfDecorator {
    (): any;
    new (): Self;
};

/**
 * Type of the Self metadata
 */
export interface Self {};

/**
 * Self decorator
 */
export const Self: SelfDecorator = makeParamDecorator('Self');


/**
 * Type for the @SkipSelf decorator
 */
export interface SkipSelfDecorator {
    (): any;
    new (): SkipSelf;
};

/**
 * Type of the SkipSelf metadata
 */
export interface SkipSelf {};

/**
 * Self decorator
 */
export const SkipSelf: SkipSelfDecorator = makeParamDecorator('SkipSelf');


/**
 * Type for the @Inject decorator
 */
export interface InjectDecorator {
    (token: Token<any>): any;
    new (token: Token<any>): Inject;
};

/**
 * Type for the Injecto metadata
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