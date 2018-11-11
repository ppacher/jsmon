import { Plugin } from '@jsmon/core';
import { HttpClientFactory } from './factory';

@Plugin({
    providers: [
        HttpClientFactory
    ]
})
export class HttpClientPlugin {}