import {makePropDecorator, ProviderToken} from '@jsmon/core';
import * as restify from 'restify';

/** A set of allowed HTTP verbs */
export type HttpVerb = 'get' | 'post' | 'put' | 'delete' | 'head' | 'trace' | 'patch';

export interface RequestSettings {
    /** The method for the route */
    method: HttpVerb;
    
    /** the actual route */
    route: string;
}

export interface HttpVerbDecorator {
    (route: string): any;
    new (route: string): Get;
}


export interface Get extends RequestSettings { method: 'get'; }
export interface Post extends RequestSettings { method: 'post'; }
export interface Delete extends RequestSettings { method: 'delete'; }
export interface Put extends RequestSettings { method: 'put'; }
export interface Patch extends RequestSettings { method: 'patch'; }

//
// HTTP Verb decorators
//

export const Get: HttpVerbDecorator = makePropDecorator('Get', makeHttpDecoratorHandler('get'));
export const Post: HttpVerbDecorator = makePropDecorator('Post', makeHttpDecoratorHandler('post'));
export const Put: HttpVerbDecorator = makePropDecorator('Put', makeHttpDecoratorHandler('put'));
export const Delete: HttpVerbDecorator = makePropDecorator('Delete', makeHttpDecoratorHandler('delete'));
export const Patch: HttpVerbDecorator = makePropDecorator('Patch', makeHttpDecoratorHandler('patch'));

function makeHttpDecoratorHandler(method: HttpVerb): (route: string) => RequestSettings {
    return (route: string) => {
        return {
            method: method,
            route: route,
        };
    }
}

//
// Middleware decorators
//

export interface Middleware<T = any> {
    handle(options: T, req: restify.Request, res: restify.Response, next: restify.Next): void;
}

export interface UseDecorator<T = any> {
    (middleware: ProviderToken<Middleware<T>>|Middleware<T>, options?: any): any;
    new (middleware: ProviderToken<Middleware<T>>|Middleware<T>, options?: any): Use<T>;
}

export interface Use<T = any> {
    middleware: ProviderToken<Middleware<T>>|Middleware<T>;
    options: T;
}

export const Use: UseDecorator<any> = makePropDecorator('Use', (middleware, options) => ({middleware, options}));