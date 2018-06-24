import {Observable} from 'rxjs/Observable';
import {
    stringify,
    makeDecorator,
    makePropDecorator,
    ANNOTATIONS,
    PROP_METADATA,
    Type,
} from '@jsmon/core';
import {IParameterDefinition, ParameterType, ISensorSchema, ICommandDefinition} from '../proto';
export {ParameterType, IParameterDefinition, ISensorSchema, ICommandDefinition} from '../proto';

export const ParameterTypeMap: {[key: number]: string} = {
    [ParameterType.ARRAY]: 'array',
    [ParameterType.BOOLEAN]: 'boolean',
    [ParameterType.TIMESTAMP]: 'number',
    [ParameterType.NUMBER]: 'number',
    [ParameterType.OBJECT]: 'object',
    [ParameterType.STRING]: 'string',
}

export interface CommandSchema {
    /** the name of the command */
    name: string;
    
    /** Parameter definitions and their accepted type */
    parameters: {
        [key: string]: IParameterDefinition|ParameterType[];
    };
    
    /** An optional short description for the command */
    shortDescription?: string;
    
    /** An optional detailed description for the command */
    longDescription?: string;
    
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

export interface SensorProvider extends ISensorSchema {
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
export const Device: DeviceDecorator = makeDecorator('Device', (settings: DeviceSettings) => ({settings}));

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
    
    const settings = meta.find((m: any) => m instanceof Device);
    
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
        [key: string]: IParameterDefinition|ParameterType[];
    };

    /** An optional short description of the command */
    shortDescription?: string;
    
    /** An optional long description of the command */
    longDescription?: string;
}

/**
 * Type of the command decorator metadata
 */
export interface Command extends CommandDecoratorSettings {}

/**
 * Type of the Command decorator
 */
export interface CommandDecorator {
    (settings: CommandDecoratorSettings): any;
    (name: string): any;
    (name: string, description: string): any;

    new (settings: CommandDecoratorSettings): Command;
    new (name: string): Command;
    new (name: string, description: string): Command;
}

/**
 * The Command decorator
 */
export const Command: CommandDecorator = makePropDecorator('Commands', (...args: any[]) => {
    if (args.length === 1) {
        if (typeof args[0] === 'string') {
            return {
                name: args[0],
            };
        }
        
        if (typeof args[0] === 'object') {
            let a = args[0] as CommandDecoratorSettings;

            return {
                name: a.name,
                description: a.shortDescription,
                parameters: a.parameters,
            };
        }
    }
    
    const name = args[0];
    if (args.length === 2) {
        if (typeof args[1] === 'string') {
            return {
                name: name,
                description: args[1],
            };
        }
    }

    throw new Error(`Invalid @Command() decorator options`);
});

/**
 * Type of the sensor decorator
 */
export interface SensorDecorator {
    (settings: ISensorSchema): any;
    (name: string, type: ParameterType, description?: string, unit?: string): any;

    new (settings: ISensorSchema): Sensor;
    new (name: string, type: ParameterType, description?: string, unit?: string): Sensor;
}

/**
 * Type of the sensor metadata
 */
export interface Sensor extends ISensorSchema {}

/**
 * The Sensor decorator
 */
export const Sensor: SensorDecorator = makePropDecorator('Sensor', (...args: any[]) => {
    let settings: ISensorSchema;
    
    if (args.length === 1) {
        settings = args[0] as ISensorSchema;
    } else {
        settings = {
            name: args[0],
            type: args[1],
            description: args[2] || '',
            unit: args[3] || ''
        };
    }
    
    return {
        name: settings.name,
        description: settings.description,
        type: settings.type,
        unit: settings.unit,
    };
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
