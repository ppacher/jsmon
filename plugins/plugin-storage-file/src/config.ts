import {Injectable} from '@homebot/core';

@Injectable()
export class JsonStoreConfig {
    constructor(
        public readonly storagePath?: string
    ) {}
}