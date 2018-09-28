import {Injectable} from '@jsmon/core';
import {HttpTextRequest} from './request';
import {HttpResponse} from './response';
import {Observable} from 'rxjs';

export interface TransportOptions {
    // TODO(ppacher): TLS options, ...
}

export const HttpTransport = 'HttpTransport';
export interface HttpTransport {
    send(request: HttpTextRequest, opts?: TransportOptions): Observable<HttpResponse>;
}

@Injectable()
export class NodeJSHttpTransport implements HttpTransport {
    send(request: HttpTextRequest, opts?: TransportOptions): Observable<HttpResponse> {
        return null;
    }
}