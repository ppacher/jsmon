import {Injectable, Optional} from '@homebot/core';
import {
    TimeSeriesStorage,
    ISensorSchema,
    QueryOptions,
    ValueIterator,
    Value,
    getSensorDiff,
    Logger
} from '@homebot/platform';

import {existsSync, statSync, readFile, writeFile, unlinkSync, appendFile, createReadStream} from 'fs';
import {join} from 'path';
import {createInterface} from 'readline';

import {JsonStoreConfig} from './config';
import {
    getStoragePathNotDirectoryError,
    getStoragePathNotExistError,
    getSensorSchemaChangedError
} from './errors';

class JsonIterator<T> implements IterableIterator<Value<T>> {
    private _pointer = 0;

    constructor(private _data: Value<T>[]) {}
    
    public next(): IteratorResult<Value<T>> {
        if (this._pointer < this._data.length) {
            return {
                done: false,
                value: this._data[this._pointer++]
            };
        }
        
        return {
            done: true,
            value: null
        };
    }
    
    [Symbol.iterator](): IterableIterator<Value<T>> {
        return this;
    }
}

@Injectable()
export class JsonStore implements TimeSeriesStorage {
    private _storageDir: string;
    private _log: Logger|null = null;

    constructor(cfg: JsonStoreConfig,
                @Optional() logger?: Logger) {
        
        if (!!logger) {
            this._log = logger.createChild('json-store');
        }
                
        this._storageDir = resolveUserHome(cfg.storagePath || '~/.homebot/jsonstore');
        
        if (!existsSync(this._storageDir)) {
            this._error(`Storage path ${this._storageDir} does not exist`);
            throw getStoragePathNotExistError(this._storageDir);
        }
        
        if (!statSync(this._storageDir).isDirectory()) {
            this._error(`Storage path ${this._storageDir} is not a directory`);
            throw getStoragePathNotDirectoryError(this._storageDir);
        }
    }

    /**
     * Checks wether a given device sensor is already setup for data persitance
     * 
     * @param deviceName The name of the device
     * @param sensorNameOrSchema  The name of the sensor or the sensors' schema
     */
    public async hasDeviceSensor(deviceName: string, sensorNameOrSchema: string|ISensorSchema): Promise<boolean> {
        if (typeof sensorNameOrSchema === 'string') {
            return this._hasSchemaFile(deviceName, sensorNameOrSchema);
        }
        
        return await this._isDeviceSensorSchemaValid(deviceName, sensorNameOrSchema)
                        .catch(err => false);
    }
    
    /**
     * Set up a new device sensor for data persistance. This is a NOP if the sensor schema
     * is already setup. If a device sensor with the same name but a different schema is registered
     * the returned promise is rejected with {@link ErrSensorSchemaChanged}.
     * 
     * @param deviceName The name of the device
     * @param sensorSchema  The sensors' schema definition
     */
    public async addDeviceSensor(deviceName: string, sensorSchema: ISensorSchema): Promise<void> {
        if (this._hasSchemaFile(deviceName, sensorSchema.name)) {
            let isValid = await this._isDeviceSensorSchemaValid(deviceName, sensorSchema);
            if (!isValid) {
                this._error(`Sensor schema for ${deviceName}:${sensorSchema.name} has changed`);
                throw getSensorSchemaChangedError(deviceName, sensorSchema.name);
            }
            
            // everything is fine, the sensor is already registered and the schema
            // matches
            return;
        }
        
        // create a new sensor
        await this._createSchemaFile(deviceName, sensorSchema)
                .catch(err => {
                    this._error(`Failed to create schema file for ${deviceName}:${sensorSchema.name}`, {err});
                    throw err;
                });
    }
    
    public async dropDeviceSensor(deviceName: string, sensorName: string): Promise<void> {
        if (!this._hasSchemaFile(deviceName, sensorName)) {
            // TODO(ppacher): should we throw??
            return;
        }
        
        const schemaPath = this._getSchemaFilePath(deviceName, sensorName);
        const dataPath = this._getSensorDataFilePath(deviceName, sensorName);

        // TODO(ppacher): how to handle errors here?
        try {
            unlinkSync(schemaPath);
        } catch(err) {
            this._error(`Failed to delete schema file for ${deviceName}:${sensorName}`, {err})
        }
        
        try {
            unlinkSync(dataPath);
        } catch(err) {
            this._error(`Failed to delete data file for ${deviceName}:${sensorName}`, {err});
        }
    }
    
    public writeValue<T>(deviceName: string, sensorName: string, value: T): Promise<void> {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().getTime();
            const line = `${timestamp}: ` + new Buffer(JSON.stringify(value), 'ascii').toString('base64') + '\n';
            
            const path = this._getSensorDataFilePath(deviceName, sensorName);
            
            appendFile(path, line, (err: NodeJS.ErrnoException) => {
                if (!!err) {
                    this._error(`Failed to write sensor data for ${deviceName}:${sensorName}`, {err});
                    reject(err);
                    return;
                }
                
                this._info(`Updated sensor data for ${deviceName}:${sensorName}`);
                resolve();
            });
        });
    }
    
    public queryValues<T>(deviceName: string, sensorName: string, opts?: QueryOptions): Promise<ValueIterator<T>> {
        return new Promise<JsonIterator<T>>(async (resolve, reject) => {
            const hasSensor = await this.hasDeviceSensor(deviceName, sensorName);
            if (!hasSensor) {
                reject(new Error(`Unknown device sensor ${deviceName}:${sensorName}`));
            }
            const dataFile = this._getSensorDataFilePath(deviceName, sensorName);
            
            let reader = createInterface(createReadStream(dataFile));
            let data: Value<T>[] = [];
            
            reader
                .on('line', line => {
                    let [timestamp, encoded] = line.split(': ');
                    let value = JSON.parse(new Buffer(encoded, 'base64').toString('ascii'));
                    
                    data.push({
                        timestamp: parseInt(timestamp),
                        value: value
                    });
                })
                .on('close', () => {
                    resolve(new JsonIterator<T>(data));
                });
        });
    }
    
    /**
     * @internal
     *
     * Checks if the persisted sensor schema of a device matches the provided
     * one. Resolves to false if it has changed, true if it is still the same.
     * On error the returned promise is rejected
     * 
     * @param deviceName The name of the device
     * @param schema  The {@link @homebot/platform:ISensorSchema} of the sensor
     */
    private _isDeviceSensorSchemaValid(deviceName: string, schema: ISensorSchema): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const path = this._getSchemaFilePath(deviceName, schema.name);
            
            if (!existsSync(path)) {
                resolve(false);
                return;
            }

            readFile(path, (err: NodeJS.ErrnoException, data: Buffer) => {
                if (!!err) {
                    reject(err);
                }
                
                let parsed: ISensorSchema;
                try {
                    parsed = JSON.parse(data.toString());
                } catch(err) {
                    reject(err);
                }
                
                let diff = getSensorDiff(parsed, schema);
                resolve(diff === null);
            });
        });
    }

    /**
     * @internal
     *
     * Synchronously checks if a schema file for the given device and sensor
     * exists
     * 
     * @param deviceName The name of the device
     * @param sensorName The name of the sensor
     */
    private _hasSchemaFile(deviceName: string, sensorName: string): boolean {
        const path = this._getSchemaFilePath(deviceName, sensorName);
        return existsSync(path);
    }
    
    /**
     * @internal
     * 
     * Returns the path to the sensor schema file of a given device sensor
     * 
     * @param deviceName The name of the device
     * @param sensorName The name of the sensor
     */
    private _getSchemaFilePath(deviceName: string, sensorName: string): string {
        // ~/.homebot/jsonstore/{deviceName}-{sensorName}.json
        return join(this._storageDir, `${deviceName}-${sensorName}.json`);
    }

    /**
     * @internal
     * 
     * Returns the path to the device sensors data file
     * 
     * @param deviceName The name of the device
     * @param sensorName The name of the sensor
     */
    private _getSensorDataFilePath(deviceName: string, sensorName: string): string {
        // ~/.homebot/jsonstore/{deviceName}-{sensorName}-data.json
        return join(this._storageDir,`${deviceName}-${sensorName}-data`);
    }
    
    /**
     * @internal
     *
     * Creates a new schema file definition for the given device sensor
     * 
     * @param deviceName The name of the device
     * @param schema     The schema definition of the sensor
     */
    private _createSchemaFile(deviceName: string, schema: ISensorSchema): Promise<void> {
        const path = this._getSchemaFilePath(deviceName, schema.name);
        const buffer = JSON.stringify(schema, undefined, 4);
        
        return new Promise((resolve, reject) => {
            writeFile(path, buffer, (err: NodeJS.ErrnoException) => {
                if (!!err) {
                    reject(err);
                }
                
                resolve();
            });
        });
    }
    
    /**
     * @internal
     * 
     * Log an info message if a logger is present
     */
    private _info(msg: string, ...args: any[]) {
        if (!!this._log) {
            this._log.info(msg, ...args);
        }
    }
    
    /**
     * @internal
     * 
     * Log an error message if a logger is present
     */
    private _error(msg: string, ...args: any[]) {
        if (!!this._log) {
            this._log.error(msg, ...args);
        }
    }
}

function resolveUserHome(filepath: string): string {
    if (filepath[0] === '~') {
        return join(process.env.HOME, filepath.slice(1));
    }
    return filepath;
}