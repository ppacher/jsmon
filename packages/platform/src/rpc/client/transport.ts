import {google} from '../../proto';
import {Headers} from '../server/transport';
import * as protobuf from 'protobufjs';

export interface Response<T> {
    body: T;
    headers: Headers;
}

export interface TransportResponse {
    headers: Headers;
    payload: google.protobuf.IAny;
}

export interface ClientTransport {
    send<T>(method: string, request: google.protobuf.IAny, headers?: Headers): Promise<TransportResponse>
}