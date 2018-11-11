import { Injectable, Logger } from '@jsmon/core';
import { HttpClient } from './client';
import { Headers } from 'request';

@Injectable()
export class HttpClientFactory {
    constructor(private _log: Logger) {}
    
    /**
     * 
     * @param name - The name for the HttpClient (for logging purposes only)
     * @param baseAddress - The base address of the remote endpoint
     * @param headers - Additional headers
     * @param insecure - Whether or not the certificate should be ignored
     */
    create(name: string, baseAddress: string, headers?: Headers, insecure: boolean = false): HttpClient {
        return new HttpClient({
            loggerName: name,
            baseURL: baseAddress,
            insecure: insecure,
            headers: headers,
        }, this._log);
    }
}
