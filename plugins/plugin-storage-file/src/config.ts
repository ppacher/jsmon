import {Injectable} from '@jsmon/core';

@Injectable()
export class JsonStoreConfig {
    constructor(
        public readonly storagePath?: string
    ) {}
}