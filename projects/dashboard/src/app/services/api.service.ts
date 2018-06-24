import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Observable} from 'rxjs';

import {LogFactory, Logger} from './logger';

export enum DeviceState {
    Unknown = 'unknown',
    Online = 'online',
    Offline = 'offline',
    Error = 'error'
}

export enum ParameterType {
    String = 0,
    Number = 1,
    Boolean = 2,
    Object = 3,
    Array = 4,
    StringArray = 5,
    NumberArray = 6,
    BooleanArray = 7,
    ObjectArray = 8,
    Any = 9,
    Timestamp = 10 
}

export interface Sensor {
    name: string;
    description: string;
    type: ParameterType;
    unit?: string;
}

export interface SensorValue extends Sensor {
    value: any;
}

export interface Parameter {
    name: string;
    description: string;
    types: ParameterType[];
    optional: boolean;
}

export interface Command {
    name: string;
    shortDescription: string;
    longDescription: string;
    parameters: Parameter[];
}

export interface Device {
    description: string;
    name: string;
    state: DeviceState;
    sensors: Sensor[];
    commands: Command[];
}

@Injectable({providedIn: 'root'})
export class APIService {
    private log: Logger;

    constructor(logger: LogFactory, private _client: HttpClient) {
        this.log = logger.createLogger('API');
    }

    getDevices(): Observable<Device[]> {
        return this._client.get<Device[]>('/api/devices');
    }

    getSensors(device: string): Observable<SensorValue[]> {
        return this._client.get<SensorValue[]>(`/api/devices/${device}/sensors`);
    }

    executeCommand(device: string, command: string, params: {[key: string]: any}): Observable<any> {
        return this._client.post<any>(`/api/devices/${device}/commands/${command}`, params);
    }
}
