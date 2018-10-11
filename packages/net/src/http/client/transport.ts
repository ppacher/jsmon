import {Injectable} from '@jsmon/core';
import {HttpTextRequest, HttpHeaders} from './request';
import {HttpResponse} from './response';
import {QueryParamCodec} from './codec';
import {Observable} from 'rxjs';

import * as http from 'http';
import * as url from 'url';

export interface TransportOptions {
    // TODO(ppacher): TLS options, ...
}

export const HttpTransport = 'HttpTransport';
export interface HttpTransport {
    send(request: HttpTextRequest, opts?: TransportOptions): Observable<HttpResponse>;
}

@Injectable()
export class NodeJSHttpTransport implements HttpTransport {
    constructor(private _queryCodec: QueryParamCodec) {}
    
    send(request: HttpTextRequest, opts?: TransportOptions): Observable<HttpResponse> {
        return new Observable<HttpResponse>(observer => {
            let {
                protocol,
                host,
                path,
            } = url.parse(request.url);
            
            if (!path) {
                path = '/';
            }
            
            if (!!request.queryParams) {
                if (!path.includes('?')) {
                    path = path + '?';
                }
                path = path + `${this._queryCodec.encode(request.queryParams.toObject())}`
            }
            
            let data: Buffer = Buffer.from('');
            
            const req = http.request({
                host: host,
                path: path,
                protocol: protocol,
                headers: !!request.headers ? request.headers.toObject() : undefined,
            }, response => {
                const responseHeaders = new HttpHeaders();

                Object.keys(response.headers)
                    .forEach(headerName => {
                        if (response.headers[headerName] === undefined) {
                            return;
                        }
                        responseHeaders.set(headerName, response.headers[headerName]!);
                    });

                response.on('data', chunk => data.write(chunk.toString()))
                response.on('end', () => observer.next({
                    statusCode: response.statusCode!,
                    status: response.statusMessage || '',
                    headers: responseHeaders,
                    contentLength: data.length,
                    body: data.toString(),
                }));
            });
            
            return () => {
                req.abort();
            }
        });
    }
}