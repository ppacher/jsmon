import {Type} from './type';
import {stringify} from '../utils/utils';

export function forwardRef(resolver: () => any): Type<any> {
    (resolver as any).__forward_ref__ = forwardRef;
    (resolver as any).toString = function() {
        return `ForwardRef<${stringify(resolver())}>`;
    }
    
    return (resolver as any as Type<any>);
}

export function resolveForwardRef(t: any): any {
    if (isForwardRef(t)) { 
        return t();
    }
    
    return t;
}

function isForwardRef(t: any): t is ForwardRef<any> {
    return typeof t === 'function' && t.hasOwnProperty('__forward_ref__') && t.__forward_ref__ === forwardRef;   
}

export interface ForwardRef<T> {
    (): Type<T>;
}