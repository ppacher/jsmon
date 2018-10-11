import * as querystring from 'querystring';

export const QueryParamCodec = 'QueryParamCodec';

/**
 * QueryParamCodec is used to encode and decode query parameters
 */
export interface QueryParamCodec {
    encode(obj: {[key: string]: any[]}): string;
    decode(str: string): {[key: string]: any[]};
}

export class NodeJSQuerystringCodec implements QueryParamCodec {
    encode(obj: {[key: string]: any[]}): string {
        return querystring.stringify(obj);
    }
    
    decode(str: string): {[key: string]: any[]} {
        const params = querystring.parse(str);
        const result: {[key: string]: any[]} = {};
        
        Object.keys(params)
            .forEach(key => {
                let value = params[key];
                
                if (value === undefined) {
                    return;
                }
                
                if (!Array.isArray(value)) {
                    value = [value];
                }
                
                result[key] = value;
            });
        return result;
    }
}