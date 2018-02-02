import {Observable} from 'rxjs/Observable';
import {
    stringify,
    makeDecorator,
    makePropDecorator,
    Type,
    ANNOTATIONS,
    PROP_METADATA,
    getDiMetadataName
} from '@homebot/core';

/** Available types for command paramters */
export enum ParameterType {
    String = 'string',
    Number = 'number',
    Boolean = 'boolean',
    Object = 'object',
    Any = 'any'
};

/** Definition for a device command parameter */
export interface ParameterDefinition {
    /** A list of accepted parameter types */
    types: ParameterType[]
    
    /** An optional help text for the parameter */
    help?: string;
    
    /** Wether or not the parameter is optional. Defaults to false */
    optional?: boolean;
}

/** Definition of a command supported by the device */
export interface CommandSchema {
    /** the name of the command */
    name: string;
    
    /** Parameter definitions and their accepted type */
    parameters: {
        [key: string]: ParameterDefinition|ParameterType[];
    };
    
    /** An optional description for the command */
    description?: string;
    
    /** The handle function to invoke for the command */
    handler: (params: Map<string, any>) => Promise<any>;
}

/** Possible states for the device health */
export enum DeviceHealthState {
    /** The device is currently online and functional */
    Online = 'online',
    
    /** The device is currently offline */
    Offline = 'offline',
    
    /** The device is in some kind of error state */
    Error = 'error',
    
    /** The state of the device is unknown (possibly 'offline' or 'error') */
    Unknown = 'unknown'
}

/** Describes the schema of a sensor/state value exported by the device */
export interface SensorSchema {
    /** Name of the sensor / state */
    name: string;
    
    /** An optional description of the sensor name */
    description?: string;
    
    /** Type of the sensor */
    type: ParameterType;
}

export interface SensorProvider extends SensorSchema {
    /** Observable that should emit changes whenever the state of the sensor changes */
    onChange: Observable<any>;
}

/** 
 * Definition of a HealthCheck function that returns the current state of
 * a device. 
 *
 * Note that implementations are allowed to cache the value and return the last
 * known state when polled on a regular interval
 */
export interface HealthCheck {
    (): Observable<DeviceHealthState>
}

/**
 * Parameter definition for the Device decorator
 */
export interface DeviceSettings {
    description?: string;  
};

/** 
 * Type of the device decorator
 */
export interface DeviceDecorator {
    (settings: DeviceSettings): any;
    
    new (settings: DeviceSettings): Device;
}

/**
 * Type of the device metadata
 */
export interface Device {
    settings: DeviceSettings;
}

/**
 * The Device decorator
 */
export const Device: DeviceDecorator = makeDecorator('Device', (settings) => ({settings}));

/**
 * Returns all device settings for a decorated class
 * 
 * @param d The class decorated by @Device
 */
export function getDeviceMetadata(d: Type<any>): DeviceSettings {
    const annotations = Object.getOwnPropertyDescriptor(d, ANNOTATIONS);
    if (annotations === undefined) {
        throw new Error(`missing @Device decorator`);
    }
    
    const meta = annotations.value;
    
    const settings = meta.find(m => {
        if (m instanceof Device) {
            return true;
        }
        
        return getDiMetadataName(m) === 'Device';
    });
    
    return settings ? settings.settings : undefined;
}

/**
 * Type of a the command decorator parameter
 */
export interface CommandDecoratorSettings {
    /** the name of the command */
    name: string;
    
    /** Parameter definitions and their accepted type */
    parameters?: {
        [key: string]: ParameterDefinition|ParameterType[];
    };
}

/**
 * Type of the command decorator metadata
 */
export interface Command {
    /** the name of the command */
    name: string;
    
    /** Parameter definitions and their accepted type */
    parameters?: {
        [key: string]: ParameterDefinition|ParameterType[];
    };
    
    /** An optional description for the command */
    description?: string;
}

/**
 * Type of the Command decorator
 */
export interface CommandDecorator {
    (settings: CommandDecoratorSettings): any;
    new (settings: CommandDecoratorSettings): Command;
}

/**
 * The Command decorator
 */
export const Command: CommandDecorator = makePropDecorator('Commands', (settings) => ({
    name: settings.name,
    description: settings.description,
}));

/**
 * Type of the sensor decorator
 */
export interface SensorDecorator {
    (settings: SensorSchema): any;
    (name: string, type: ParameterType, description?: string): any;

    new (settings: SensorSchema): Sensor;
    new (name: string, type: ParameterType, description?: string): Sensor;
}

/**
 * Type of the sensor metadata
 */
export interface Sensor extends SensorSchema {}

/**
 * The Sensor decorator
 */
export const Sensor: SensorDecorator = makePropDecorator('Sensor', (...args: any[]) => {
    let settings: SensorSchema;
    
    if (args.length === 1) {
        settings = args[0] as SensorSchema;
    } else {
        settings = {
            name: args[0],
            type: args[1],
            description: args[2],
        };
    }
    
    return {
        name: settings.name,
        description: settings.description,
        type: settings.type,
    }
});

/**
 * Returns a set of property metadata attached to a class
 * 
 * @param d The class to return property metadata for
 */
export function getPropertyMetadata(d: Type<any>): {[name: string]: (Command|Sensor)[]} {
    const annotations = Object.getOwnPropertyDescriptor(d, PROP_METADATA);
    
    if (annotations === undefined) {
        return {};
    }
    
    return annotations.value;
}
