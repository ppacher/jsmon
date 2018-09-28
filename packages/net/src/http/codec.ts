/**
 * QueryParamCodec is used to encode and decode query parameters
 */
export interface QueryParamCodec {
    encode(obj: {[key: string]: any[]}): string;
    decode(str: string): {[key: string]: any[]};
}

export class NodeJSQuerystringCodec implements QueryParamCodec {
    encode(obj: {[key: string]: any[]}): string {
        return 'not yet implemented';
    }
    
    decode(str: string): {[key: string]: any[]} {
        return {};
    }
}