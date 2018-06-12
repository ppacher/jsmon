import {Injectable} from '@jsmon/core';
import {HostScanner} from '../scanner.interface';

const nmap = require('node-nmap');

interface ScanResult {
    hostname: string|null;
    ip: string;
    mac: string|null;
    openPorts: number[]|null;
    osNmap: string|null;
}

@Injectable()
export class NmapScanner implements HostScanner {

    scan(subnet: string): Promise<string[]> {
        let quickScan = new nmap.QuickScan(subnet, '-T4 -R'); // -T4: scan faster and -R: always do DNS resolution

        return new Promise((resolve, reject) => {
            quickScan.on('error', (err: any) => reject(err));
            quickScan.on('complete', (result: ScanResult[]) => {
                resolve(result.map(r => r.hostname || r.ip));
            });
        });
    }
}