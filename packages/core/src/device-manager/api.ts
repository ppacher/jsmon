import {SensorSchema, Command} from './device';

export interface SensorValueMessage extends SensorSchema {
    value: any;
}

export interface DeviceMessage {
    name: string;
    description?: string;
    sensors: SensorSchema[];
    commands: Command[];
}