import {Provider, Type} from '@homebot/core';
import {TimeSeriesStorage} from './storage.interface';


/**
 * Dependency Injection Token for the Storage Adpater
 */
export const StorageAdapter = 'Storage-Adapter';

/**
 * Provides a {@link TimeSeriesStorage} adapter for dependecy injection
 * 
 * @param t The type of {@link TimeSeriesStorage} to use
 */
export function provideStorageAdapter<T extends TimeSeriesStorage>(t: Type<T>): Provider {
    return {
        provide: StorageAdapter,
        useClass: t
    };
}
