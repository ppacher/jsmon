import {Config, ConfigLoader} from '../config';
import {dirname, resolve} from 'path';

const base = dirname(__filename);

function fromV1Data(path: string): string {
    return resolve(base, 'v1-data', path);
}

function expectV1Valid(c: Config) {
    expect(c).toBeDefined();
    expect(c.platforms.length).toBe(1);
    expect(c.platforms[0].length).toBe(2);
    expect(c.platforms[0][0]).toBe('firetv');

    const firetv = c.platforms[0][1];
    expect(firetv.enable.length).toBe(1);
    
    const local = firetv.enable[0];
    expect(local.name).toBe('LivingRoom');
    expect(local.params.host).toBe('192.168.0.1');
}

describe('ConfigLoader', () => {
    describe('v1', () => {
        let v1JSON = fromV1Data('valid.json');
        let v1JS = fromV1Data('valid.js');
        let v1YAML = fromV1Data('valid.yaml');

        it('should load a JSON file', () => {
            let cfg = new ConfigLoader(v1JSON);
            
            let c = cfg.load();
            
            expectV1Valid(c);
        });
    });
});
