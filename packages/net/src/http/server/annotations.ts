import {makePropDecorator} from '@jsmon/core/utils';

/** A set of allowed HTTP verbs */
export type HttpVerb = 'get' | 'post' | 'put' | 'delete' | 'head' | 'trace' | 'patch';

export interface RequestSettings {
    /** The method for the route */
    method?: HttpVerb;
    
    /** the actual route */
    route: string;
    
    /** The accepted content type */
    contentType?: string;
}

export interface HttpVerbDecorator {
    (routeOrSettings: string|RequestSettings): any;
    new (routeOrSettings: string|RequestSettings): Get;
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

function makeHttpDecoratorHandler(method: HttpVerb): (routeOrSettings: string|RequestSettings) => RequestSettings {
    return (routeOrSettings: string|RequestSettings) => {
        if (typeof routeOrSettings === 'string') {
            routeOrSettings = {
                route: routeOrSettings,
            }
        }
        
        routeOrSettings.method = method;
        return routeOrSettings;
    }
}