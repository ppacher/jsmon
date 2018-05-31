import {SensorSchema} from '../devices';

export interface QueryOptions {
    from?: number;
    to?: number;
};

export interface Value<T> {
    value: T;
    timestamp: number;
}

export type ValueIterator<T> = Iterator<Value<T>>;

export abstract class TimeSeriesStorage {
    /**
     * Checks wether the storage already knows about a device sensor
     * If a sensor schema is passed, the implementation should check if the 
     * sensor schema is the same and reject the promise with {@link ErrSensorSchemaChanged} if different
     * 
     * @param deviceName The name of the device to query
     * @param sensorNameOrSchema The name or schema of the sensor to query
     */
    abstract hasDeviceSensor(deviceName: string, sensorNameOrSchema: string|SensorSchema): Promise<boolean>;
    
    /**
     * Setup a new measurement for a device sensor
     * The actual implementation should do nothing if the sensor with the same schema is already
     * registered. If the sensor is already registered but with a different scheme the return
     * Promise should be rejected with {@link ErrSensorSchemaChanged}
     * 
     * @param deviceName The name of the device to register
     * @param sensorSchema The schema of the sensor to setup
     */
    abstract addDeviceSensor(deviceName: string, sensorSchema: SensorSchema): Promise<void>;
    
    /**
     * Drop a device sensor from the storage
     * 
     * @param deviceName  The name of the device to drop
     * @param sensorName  The name of the sensor to drop
     */
    abstract dropDeviceSensor(deviceName: string, sensorName: string): Promise<void>;
    
    /**
     * Store a new measurement point for a given device sensor
     * 
     * @param deviceName The name of the device
     * @param sensorName The name of the sensor
     * @param value      The actual value to persist
     */
    abstract writeValue<T>(deviceName: string, sensorName: string, value: T): Promise<void>;
    
    /**
     * Performs a storage query for measurement points of a device sensor
     * 
     * @param deviceName The name of the device to query
     * @param sensorName The name of the sensor to query
     * @param opts  Optional query options
     */
    abstract queryValues<T>(deviceName: string, sensorName: string, opts?: QueryOptions): Promise<ValueIterator<T>>;
}