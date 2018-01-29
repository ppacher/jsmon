import {Type} from './type';

/**
 * Token used to identify dependency injection targets
 */
export type Token<T> = Symbol | Type<T> | any;
