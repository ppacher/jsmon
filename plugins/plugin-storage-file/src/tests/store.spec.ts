import {JsonStore} from '../json-store';
import {JsonStoreConfig} from '../config';

import {Value} from '@homebot/platform';

import {mkdirSync, existsSync, writeFileSync, unlinkSync, readFileSync, appendFileSync} from 'fs';
import {join} from 'path';
import {ISensorSchema, ParameterType} from '@homebot/platform';

// we are using rimraf instead of fs.rmdirSync as it allows deleting
// non-empty directories
let rmdir = require('rimraf');

const testDataDir = './test-data';

describe('JsonStore', () => {
    beforeAll(async () => {
        if (existsSync(testDataDir)) {
            await new Promise((resolve) => {
                rmdir(testDataDir, resolve);
            });
        }
        
        mkdirSync(testDataDir);
    });

    afterAll(async ()=> {
        await new Promise(resolve => rmdir(testDataDir, resolve));
    });
    
    describe('storage path', () => {
        it('should throw for a non-existing path', () => {
            expect(() => {
                new JsonStore(new JsonStoreConfig('does-not-exist'));
            }).toThrow();
        });

        it('should not throw for a valid path', () => {
            expect(() => {
                new JsonStore(new JsonStoreConfig(testDataDir));
            }).not.toThrow();
        });
        
        let path = join(testDataDir, 'foobar');

        beforeEach(() => {
            writeFileSync(path, 'something', {flag: 'w+'});

            expect(existsSync(path)).toBe(true);
        });
        
        afterEach(() => {
            unlinkSync(path);
        });

        it('should throw for a non-directory path', () => {
            expect(() => {
                new JsonStore(new JsonStoreConfig(path));
            }).toThrow();
        })
    });    
    
    describe('hasDeviceSensor', () => {
        let sensor: ISensorSchema = {
            name: 'dummy',
            description: 'dummy description',
            type: ParameterType.STRING,
        };
        let store: JsonStore;
        
        beforeAll(() => {
            writeFileSync(join(testDataDir, 'device-dummy.json'), JSON.stringify(sensor), {flag: 'w+'});
        });
        
        afterAll(() => {
            unlinkSync(join(testDataDir, 'device-dummy.json'));
        });

        beforeEach(() => {
            store = new JsonStore(new JsonStoreConfig(testDataDir));
        });
        
        it('should check availability via names', async () => {
            expect(await store.hasDeviceSensor('device', 'dummy')).toBe(true);
            expect(await store.hasDeviceSensor('another', 'dummy')).toBe(false);
            expect(await store.hasDeviceSensor('device', 'another')).toBe(false);
        });
        
        it('should check via sensor schemas', async () => {
            expect(await store.hasDeviceSensor('device', sensor)).toBe(true);
            expect(await store.hasDeviceSensor('another', sensor)).toBe(false);
            let s2 = {
                ...sensor,
                name: 'foobar'
            };
            expect(await store.hasDeviceSensor('device', s2)).toBe(false);
        });
    });
    
    describe('addDeviceSensor', () => {
        let sensor: ISensorSchema = {
            name: 'dummy',
            description: 'dummy description',
            type: ParameterType.STRING,
        };
        let store: JsonStore;
        
        beforeAll(() => {
            writeFileSync(join(testDataDir, 'device-dummy.json'), JSON.stringify(sensor), {flag: 'w+'});
        });
        
        afterAll(() => {
            unlinkSync(join(testDataDir, 'device-dummy.json'));
        });

        beforeEach(() => {
            store = new JsonStore(new JsonStoreConfig(testDataDir));
        });
        
        it('should do nothing if the sensor exists', () => {
            expect(store.addDeviceSensor('device', sensor)).resolves.toBe(undefined);
        });

        it('should throw if the sensor changed', () => {
            let s = {
                ...sensor,
                type: ParameterType.ARRAY,
            }
            
            expect(store.addDeviceSensor('device', s)).rejects.toBeDefined();
        });

        it('should create a new schema file', async () => {
            let s = {
                ...sensor,
                name: 'test'
            }
            expect(await store.addDeviceSensor('device', s)).toBe(undefined);
            expect(existsSync(join(testDataDir, 'device-test.json'))).toBe(true);
            expect(JSON.parse(readFileSync(join(testDataDir, 'device-test.json')).toString('ascii'))).toEqual(s);
            unlinkSync(join(testDataDir, 'device-test.json'));
        });
    });

    describe('dropDeviceSensor', () => {
        let sensor: ISensorSchema = {
            name: 'dummy',
            description: 'dummy description',
            type: ParameterType.STRING,
        };
        let store: JsonStore;
        
        beforeAll(() => {
            let ts = new Date(2018, 1, 1, 1, 1, 1, 1).getTime();
            let value = `${ts}: ` + new Buffer(JSON.stringify('foobar'), 'ascii').toString('base64');
            
            writeFileSync(join(testDataDir, 'device-dummy-data'), value);
            writeFileSync(join(testDataDir, 'device-dummy.json'), JSON.stringify(sensor), {flag: 'w+'});
        });
        
        afterAll(() => {
            unlinkSync(join(testDataDir, 'device-dummy-data'));
            unlinkSync(join(testDataDir, 'device-dummy.json'));
        });

        beforeEach(() => {
            store = new JsonStore(new JsonStoreConfig(testDataDir));
        });

        it('should do nothing for non-existing sensors', async () => {
            expect(await store.dropDeviceSensor('device', 'foobar')).toBeUndefined();
        });
        
        it('should delete the schema file', async () => {
            expect(await store.dropDeviceSensor('device', 'dummy')).toBeUndefined();
            expect(existsSync(join(testDataDir, 'device-dummy.json'))).toBe(false);
        });
        
        it('should delete the data file', async () => {
            expect(await store.dropDeviceSensor('device', 'dummy')).toBeUndefined();
            expect(existsSync(join(testDataDir, 'device-dummy-data'))).toBe(false);
        });
    });

    describe('writeValue', () => {
        let sensor: ISensorSchema = {
            name: 'dummy',
            description: 'dummy description',
            type: ParameterType.STRING,
        };
        let store: JsonStore;
        
        beforeAll(() => {
            writeFileSync(join(testDataDir, 'device-dummy.json'), JSON.stringify(sensor), {flag: 'w+'});
        });
        
        afterAll(() => {
            unlinkSync(join(testDataDir, 'device-dummy.json'));
        });

        beforeEach(() => {
            store = new JsonStore(new JsonStoreConfig(testDataDir));
        });

        describe('without a datafile', () => {
            it('should create the file and write the value', async () => {
                expect(await store.writeValue('device', 'dummy', 'foobar')).toBeUndefined();
                expect(existsSync(join(testDataDir, 'device-dummy-data'))).toBe(true);
                
                let content = readFileSync(join(testDataDir, 'device-dummy-data')).toString();
                let [ts, value] = content.split(': ');
                
                expect(ts).toBeDefined();
                expect(value).toEqual(new Buffer(JSON.stringify('foobar')).toString('base64') + '\n');
            });
        });

        describe('with an existing data file', () => {
            beforeAll(() => {
                let ts = new Date(2018, 1, 1, 1, 1, 1, 1).getTime();
                let value = `${ts}: ` + new Buffer(JSON.stringify('foobar'), 'ascii').toString('base64') + '\n';
                
                writeFileSync(join(testDataDir, 'device-dummy-data'), value);
            });
            
            afterAll(() => {
                unlinkSync(join(testDataDir, 'device-dummy-data'));
            });
            
            it('should append to existing data files', async () => {
                expect(await store.writeValue('device', 'dummy', 'foobar')).toBeUndefined();
                let content = readFileSync(join(testDataDir, 'device-dummy-data')).toString();
                expect(content.split('\n').length).toBe(3); // 2 + one empty new-line
            });
        });
    });

    describe('queryValues', () => {
        let sensor: ISensorSchema = {
            name: 'dummy',
            description: 'dummy description',
            type: ParameterType.STRING,
        };
        let store: JsonStore;
        
        beforeAll(() => {
            let ts = new Date(2018, 1, 1, 1, 1, 1, 1).getTime();
            let value = `${ts}: ` + new Buffer(JSON.stringify('foobar'), 'ascii').toString('base64') + '\n';
            let ts2 = new Date(2018, 1, 1, 1, 1, 1, 1).getTime();
            let value2 = `${ts2}: ` + new Buffer(JSON.stringify('barfoo'), 'ascii').toString('base64') + '\n';
            
            writeFileSync(join(testDataDir, 'device-dummy-data'), value);
            appendFileSync(join(testDataDir, 'device-dummy-data'), value2);
            writeFileSync(join(testDataDir, 'device-dummy.json'), JSON.stringify(sensor), {flag: 'w+'});
        });
        
        afterAll(() => {
            unlinkSync(join(testDataDir, 'device-dummy-data'));
            unlinkSync(join(testDataDir, 'device-dummy.json'));
        });

        beforeEach(() => {
            store = new JsonStore(new JsonStoreConfig(testDataDir));
        });

        it('should return a working iterator', async () => {
            let iterator = await store.queryValues('device', 'dummy') as IterableIterator<Value<any>>;
            
            expect([...iterator].length).toBe(2);
        });
        
        it('should yield correct values', async () => {
            let iterator = await store.queryValues('device', 'dummy') as IterableIterator<Value<any>>;

            let v = iterator.next();
            expect(v.done).toBeFalsy();
            expect(v.value.value).toBe('foobar');
            
            v = iterator.next();
            expect(v.done).toBeFalsy();
            expect(v.value.value).toBe('barfoo');
            
            v = iterator.next();
            expect(v.done).toBeTruthy();
            expect(v.value).toBeNull();
        });
    })
});