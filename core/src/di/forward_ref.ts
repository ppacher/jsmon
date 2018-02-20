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
    if (typeof t === 'function' && t.hasOwnProperty('__forward_ref__') && t.__forward_ref__ === forwardRef) {
        return t();
    }
    
    return t;
}