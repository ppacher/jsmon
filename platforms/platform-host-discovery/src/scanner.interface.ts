import {Provider, Type} from '@homebot/core';

export const ScanProvider = 'ScanProvider';

export interface HostScanner {
    scan(subnet: string): Promise<string[]>;
}

export function provideScanner<T extends HostScanner>(provider: Type<T>): Provider {
    return {
        provide: ScanProvider,
        useClass: provider
    }
}