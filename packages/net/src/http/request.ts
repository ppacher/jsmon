import {QueryParamCodec, NodeJSQuerystringCodec} from './codec';

/**
 * Support HTTP version
 */
export type HttpVersion = 'http/1.0'
                        | '1.0'
                        | 'http/1.1'
                        | '1.1';
                        
/**
 * Support HTTP methods
 */
export type HttpMethod = 'get'
                       | 'post'
                       | 'put'
                       | 'options'
                       | 'head'
                       | 'trace'
                       | 'patch'
                       | 'delete';
                       
/**
 * Utitlity class for preparing and manipulating HTTP headers
 */
export class HttpHeaders {
    private _headers: {
        [key: string]: string[];
    } = {};

    /**
     * Adds a value to a header field
     * 
     * @param header - The name of the header field
     * @param value - The value for the header field
     */
    add(header: string, value: string): this {
        const values = this._headers[header] || [];
        values.push(value);
        
        this._headers[header] = values;
        
        return this;
    }
    
    /**
     * Sets the value(s) for a header field
     * 
     * @param header - The name of the header field
     * @param value - The value(s) of the header field
     */
    set(header: string, value: string|string[]): this {
        if (!Array.isArray(value)) {
            value = [value];
        }
        
        this._headers[header] = value;
        return this;
    }
    
    /**
     * Returns the current values of a header field
     * 
     * @param header - The name of the header field
     */
    get(header: string): string[] {
        return this._headers[header] || [];
    }
    
    /**
     * Clones the current HttpHeader instance and returns a new one
     */
    clone(): HttpHeaders {
        const clone = new HttpHeaders();

        Object.keys(this._headers).forEach(key => {
            clone.set(key, this._headers[key]);
        });

        return clone;
    }
}


/**
 * Utility class for working with query parameters
 */
export class QueryParams {
    private _params: {[key: string]: any[]} = {};
    
    constructor(private _codec?: QueryParamCodec) {
        if (!this._codec) {
            this._codec = new NodeJSQuerystringCodec();
        }
    }
    
    /**
     * Sets one or more values for a query parameter overwriting existing
     * ones
     * 
     * @param key - The name of the query parameter
     * @param value - One or more values for the query paramter
     */
    set(key: string, value: any|any[]): this {
        if (!Array.isArray(value)) {
            value = [value];
        } 
        
        this._params[key] = value;
        return this;
    }

    /**
     * Adds a value to a query parameter
     * 
     * @param key - The name of the query parameter
     * @param value - The value to add to the query parameter
     */
    add(key: string, value: any): this {
        const values = this._params[key] || [];
        values.push(value);

        this._params[key] = values;
        return this;
    }
    
    /**
     * Returns the first value of a query parameter
     * 
     * @param key - The name of the query parameter
     */
    get(key: string): any {
        const values = this._params[key];
        
        if (!!values && values.length > 0) {
            return values[0];
        }
        
        return [];
    }
    
    /**
     * Returns all values of a query parameter
     * 
     * @param key - The name of the query parameter
     */
    getAll(key: string): any[] {
        return this._params[key] || [];
    }
    
    /**
     * Invoke a callback function for each query parameter
     * 
     * @param cb - The callback function to invoke for each query paramter
     */
    forEach(cb: (name: string, values: any[]) => void): void {
        Object.keys(this._params).forEach(key => cb(key, this._params[key]));
    }
}

/**
 * HttpRequest describes a HTTP requests
 */
export interface HttpRequest {
    /** The HTTP version to use. Defaults to HTTP/1.1 */
    version?: HttpVersion;
    
    /** The HTTP method to use. Defaults to GET */
    method?: HttpMethod;
    
    /** The HTTP endpoint; It may already contain query parameters */
    url: string;

    /** Optional query parameters */
    queryParams?: QueryParams;
    
    /** The body for the HTTP request */
    body?: any;
    
    /** An header object for the request */
    headers?: HttpHeaders

    responseType?: 'text'|'json';
}

export interface HttpTextRequest extends HttpRequest {
    responseType: 'text';
    body: string;
}

export interface HttpJsonRequest extends HttpRequest {
    responseType: 'json';
    body: string|any[]|object|null;
}