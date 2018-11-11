import { Logger } from '@jsmon/core';
import { HttpVerb } from '../server';
import request from 'request-promise-native';
import { OptionsWithUrl } from 'request';

/**
 * Options for the HTTP client
 */
export interface HttpClientOptions {
    /** A name for the logger, default to "http-client" if not set */
    loggerName?: string;

    /** The base endpoint address for the HttpClient */
    baseURL: string;
    
    /** Whether or not certificates should be validated */
    insecure?: boolean;
    
    /** Additional headers to send with each request */
    headers?: {[key: string]: string|string[]};
    
    /** An optional request timeout in milliseconds */
    timeout?: number;
}

export interface QueryParams {
    [key: string]: any;
}

export class HttpClient {
    constructor(private _options: HttpClientOptions,
                private _log: Logger) {
        this._log = this._log.createChild(this._options.loggerName || 'http-client');
        
        if (!this._options.baseURL.endsWith('/')) {
            this._options.baseURL += '/';
        }
    }
    
    /**
     * Sends a GET request
     * 
     * @param endpoint - The endpoint for the request
     * @param queryParams - Additional query parameters
     */
    get<T>(endpoint: string, queryParams?: QueryParams): Promise<T> {
        return this.request('get', endpoint, queryParams);
    }
    
    /**
     * Sends a POST request with a given body
     * 
     * @param endpoint - The endpoint for the request
     * @param body - The request body
     */
    post<T>(endpoint: string, body?: any): Promise<T>;
    
    /**
     * Sends a POST request with a given body and query parameters
     * 
     * @param endpoint - The endpoint for the request
     * @param queryParams - The query paramters
     * @param body - The request body
     */
    post<T>(endpoint: string, queryParams?: QueryParams, body?: any): Promise<T>;
    
    /**
     * @internal
     * The actual implementation for post
     */
    post<T>(endpoint: string, queryParamsOrBody?: any, body?: any): Promise<T> {
        console.log("======POST", endpoint, queryParamsOrBody, body);
        return this.request('post', endpoint, queryParamsOrBody, body);
    }
    
    /**
     * Sends a PUT request with the given body
     * 
     * @param endpoint - The endpoint for the request
     * @param body  - The request body
     */
    put<T>(endpoint: string, body?: any): Promise<T>;
    
    /**
     * Sends a PUT request with the given body and query strings
     * 
     * @param endpoint - The endpoint for the request
     * @param queryParams - The query paramters
     * @param body  - The request body
     */
    put<T>(endpoint: string, queryParams?: QueryParams, body?: any): Promise<T>;
    
    /**
     * @internal
     * The acutal implementation for put
     */
    put<T>(endpoint: string, queryParamsOrBody?: any, body?: any): Promise<T> {
        return this.request('put', endpoint, queryParamsOrBody, body);
    }
    
    /**
     * Sends a DELETE request with the given body (if any)
     * 
     * @param endpoint - The endpoint for the request
     * @param body - The request body (if any)
     */
    delete<T>(endpoint: string, queryParams?: QueryParams, body?: any): Promise<T> {
        return this.request('delete', endpoint, queryParams, body);
    }
    

    request<T>(method: 'get', endpoint: string, queryParams?: QueryParams): Promise<T>;
    request<T>(method: 'delete', endpoint: string, queryParams?: QueryParams, body?: any): Promise<T>;
    request<T>(method: 'put', endpoint: string, queryParams?: QueryParams, body?: any): Promise<T>;
    request<T>(method: 'put', endpoint: string, body?: any): Promise<T>;
    request<T>(method: 'post', endpoint: string, queryParams?: QueryParams, body?: any): Promise<T>;
    request<T>(method: 'post', endpoint: string, body?: any): Promise<T>;
    

    request(method: HttpVerb, endpoint: string, queryParamsOrBody?: QueryParams|any, body?: any): Promise<any> {
        let queryParams: QueryParams | undefined = undefined;
        let actualBody: any | undefined = undefined;


        if (method === 'get') {
            if (body !== undefined) {
                throw new Error(`Body not allowed for 'GET' method`);
            }
            
            queryParams = queryParamsOrBody;
        } else
        if (method === 'post' || method === 'put') {
            if (body === undefined) {
                actualBody = queryParamsOrBody;
            } else {
                queryParams = queryParamsOrBody;
                actualBody = body;
            }
        } else
        if (method === 'delete') {
            queryParams = queryParamsOrBody;
            actualBody = body;
        }
        
        const options = this._getRequestOptions(method, endpoint, queryParams, actualBody)

        return request(options)
            .catch(err => {
                this._log.error(`${method} ${options.url}: ${err}`);
                
                throw err;
            });
    }
    
    private _getRequestOptions(method: string, endpoint: string, queryParams?: QueryParams, body?: any): OptionsWithUrl  {
        if (endpoint.startsWith('/')) {
            endpoint = endpoint.slice(1);
        }
        return {
            url: `${this._options.baseURL}${endpoint}`,
            qs: queryParams,
            json: true,
            method: method,
            body: body,
            headers: this._options.headers,
            rejectUnauthorized: this._options.insecure,
            timeout: this._options.timeout
        }
    }
}