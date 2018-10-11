import {Optional, Inject, Injectable} from '@jsmon/core';
import {Observable} from 'rxjs';
import {HttpHeaders, HttpRequest, HttpJsonRequest, HttpTextRequest, HttpMethod, QueryParams} from './request';
import {HttpResponse} from './response';
import {HttpTransport, TransportOptions, NodeJSHttpTransport} from './transport';
import {NodeJSQuerystringCodec, QueryParamCodec} from './codec';

/**
 * RequestOptions holds additional options for HTTP requests
 */
export interface RequestOptions {
    /**
     * The expected content type. If set, the HttpClient will automatically
     * parse the response into the appropriate format
     */
    responseType?: 'json'|'text';
    
    /**
     * Additional HTTP headers for the request
     */
    headers?: HttpHeaders;
    
    /**
     * Options for handling the HTTP transport
     */
    transport?: TransportOptions;
}

/**
 * RequestOptions that expect a JSON result. For type-safety only
 */
export interface JSONRequestOptions extends RequestOptions {
    responseType: 'json';
}

/**
 * RequestOptions that expect a text result. For type-safety only
 */
export interface PlainRequestOptions extends RequestOptions {
    responseType: 'text';
}

@Injectable()
export class HttpClient {
    constructor(@Optional() @Inject(HttpTransport) private _transport?: HttpTransport,
                @Optional() @Inject(QueryParamCodec) private _queryCodec?: QueryParamCodec) {
        if (!this._queryCodec) {
            this._queryCodec = new NodeJSQuerystringCodec();
        }
        
        if (!this._transport) {
            this._transport = new NodeJSHttpTransport(this._queryCodec);
        }
    }
    
    request(request: HttpRequest): Observable<HttpResponse>;
    request<T>(request: HttpJsonRequest): Observable<T>;
    request(request: HttpTextRequest): Observable<string>;
    
    request(request: HttpRequest|HttpJsonRequest|HttpTextRequest): Observable<any> {
        return new Observable<any>(observer => {
            // Check content type
            let contentType: string|null = null;
            if (!!request.headers && request.headers.get('content-type').length > 0) {
                contentType = request.headers.get('content-type')[0];
            }
            
            if (contentType === null && request.body !== undefined) {
                switch (typeof request.body) {
                case 'string':
                    contentType = 'plain/text';
                    break;
                default:
                    contentType = 'application/json';
                }
            }
            
            if (request.body !== undefined) {
                if (!!contentType) {
                    if (contentType.includes('application/json')) {
                        request.body = JSON.stringify(request.body);
                    } else
                    if (contentType.includes('plain/text') && typeof request.body !== 'string') {
                        observer.error(`Invalid type for request.body. Expected 'string' but got '${typeof request.body}'`);
                        return;
                    }
                }
            } 
            
            let sub = this._transport!.send(request as HttpTextRequest)
                .subscribe(response => {
                    observer.next(response);
                }, err => observer.error(err));

            return () => {
                sub.unsubscribe();
            }
        });
    }
    
    //
    // GET method calls
    //

    get(url: string, opts?: RequestOptions): Observable<HttpResponse>;
    get(url: string, opts?: PlainRequestOptions): Observable<string>;
    get<T>(url: string, opts?: JSONRequestOptions): Observable<T>;
    get(url: string, queryParams?: QueryParams, opts?: RequestOptions): Observable<HttpResponse>;
    get(url: string, queryParams?: QueryParams, opts?: PlainRequestOptions): Observable<string>;
    get<T>(url: string, queryParams?: QueryParams, opts?: JSONRequestOptions): Observable<T>;
    
    get(url: string, queryOrOpts?: RequestOptions|QueryParams, opts?: RequestOptions): Observable<any> {
        return this.request(this._buildRequest('get', url, queryOrOpts, opts));
    }
     
    //
    // DELETE method calls
    //

    delete(url: string, opts?: RequestOptions): Observable<HttpResponse>;
    delete(url: string, opts?: PlainRequestOptions): Observable<string>;
    delete<T>(url: string, opts?: JSONRequestOptions): Observable<T>;
    delete(url: string, queryParams?: QueryParams, opts?: RequestOptions): Observable<HttpResponse>;
    delete(url: string, queryParams?: QueryParams, opts?: PlainRequestOptions): Observable<string>;
    delete<T>(url: string, queryParams?: QueryParams, opts?: JSONRequestOptions): Observable<T>;  
    
    delete(url: string, queryOrOpts?: RequestOptions|QueryParams, opts?: RequestOptions): Observable<any> {
        return this.request(this._buildRequest('delete', url, queryOrOpts, opts));
    }
    
    //
    // POST method calls
    //

    post(url: string, body: any, opts?: RequestOptions): Observable<HttpResponse>;
    post(url: string, body: any, opts?: PlainRequestOptions): Observable<string>;
    post<T>(url: string, body: any, opts?: JSONRequestOptions): Observable<T>;
    post(url: string, body: any, queryParams?: QueryParams, opts?: RequestOptions): Observable<HttpResponse>;
    post(url: string, body: any, queryParams?: QueryParams, opts?: PlainRequestOptions): Observable<string>;
    post<T>(url: string, body: any, queryParams?: QueryParams, opts?: JSONRequestOptions): Observable<T>;
    
    post(url: string, body: any, queryOrOpts?: QueryParams|RequestOptions, opts?: RequestOptions): Observable<any> {
        return this.request(this._buildRequest('post', url, queryOrOpts, opts, body));
    }

    //
    // PUT method calls
    //

    put(url: string, body: any, opts?: RequestOptions): Observable<HttpResponse>;
    put(url: string, body: any, opts?: PlainRequestOptions): Observable<string>;
    put<T>(url: string, body: any, opts?: JSONRequestOptions): Observable<T>;
    put(url: string, body: any, queryParams?: QueryParams, opts?: RequestOptions): Observable<HttpResponse>;
    put(url: string, body: any, queryParams?: QueryParams, opts?: PlainRequestOptions): Observable<string>;
    put<T>(url: string, body: any, queryParams?: QueryParams, opts?: JSONRequestOptions): Observable<T>;
    
    put(url: string, body: any, queryOrOpts?: QueryParams|RequestOptions, opts?: RequestOptions): Observable<any> {
        return this.request(this._buildRequest('put', url, queryOrOpts, opts, body));
    }

    //
    // PATCH method calls
    //

    patch(url: string, body: any, opts?: RequestOptions): Observable<HttpResponse>;
    patch(url: string, body: any, opts?: PlainRequestOptions): Observable<string>;
    patch<T>(url: string, body: any, opts?: JSONRequestOptions): Observable<T>;
    patch(url: string, body: any, queryParams?: QueryParams, opts?: RequestOptions): Observable<HttpResponse>;
    patch(url: string, body: any, queryParams?: QueryParams, opts?: PlainRequestOptions): Observable<string>;
    patch<T>(url: string, body: any, queryParams?: QueryParams, opts?: JSONRequestOptions): Observable<T>;
    
    patch(url: string, body: any, queryOrOpts?: QueryParams|RequestOptions, opts?: RequestOptions): Observable<any> {
         return this.request(this._buildRequest('patch', url, queryOrOpts, opts, body));       
    }
    
    private _buildRequest(method: HttpMethod, url: string, queryOrOpts?: QueryParams|RequestOptions, opts?: RequestOptions, body?: any): HttpRequest {
        let queryParams: QueryParams|undefined = undefined;
        let options: RequestOptions|undefined = undefined;
        
        if (queryOrOpts !== undefined) {
            if (queryOrOpts instanceof QueryParams) {
                queryParams = queryOrOpts;
            } else {
                options = queryOrOpts;
            }
        }
        
        if (!!opts) {
            if (!!options) {
                throw new Error(`Multiple request options specified`);
            }
            options = opts;
        }
        
        return {
            version: 'http/1.1',
            url: url,
            method: method,
            responseType: !!options ? options.responseType : undefined,
            queryParams: queryParams,
            headers: !!options ? options.headers : undefined,
            body: body
        };
    }
}