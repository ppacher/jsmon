import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {_throw} from 'rxjs/observable/throw';
import {fromPromise} from 'rxjs/observable/fromPromise';
import {subscribeOn} from 'rxjs/operator/subscribeOn';
import {of} from 'rxjs/observable/of';

import 'rxjs/add/operator/map';

export namespace Device {
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
     * @class Device
     * 
     * @description
     * Describes how the device manager should handle and register commands
     * of a device
     */
    export class Device {
        private _health: BehaviorSubject<DeviceHealthState> = new BehaviorSubject<DeviceHealthState>(DeviceHealthState.Unknown);
        private _sensorValues: BehaviorSubject<{[key:string]: any}> = new BehaviorSubject<{[key:string]:any}>({});
        
        constructor(
            /** The name of the device */
            public name: string,

            /** A list of commands supported by the device */
            public commands: CommandSchema[],
            
            private _sensors: SensorProvider[],
            
            /** An optional health check function, defaults to DeviceHealthState.Unknown */
            private _checkHealth: HealthCheck = () => of(DeviceHealthState.Unknown),
            
            /** An optional description of the device */
            private _description: string = ''
        ) {
            /** Subscribe to health values */
            this._checkHealth()
                .subscribe(state => this._health.next(state));
            
            this._sensors
                .forEach(sensor => {
                    let sensorSubcription = sensor.onChange
                        .subscribe(value => {
                            this._updateSensorValue(sensor, value);
                        });
                });
        }
        
        /**
         * Executes a command with the provided arguments and returns
         * and observable that emits the results when available
         *
         * @param command   The name of the command to execute
         * @param args      Additional arguments to pass to the command
         */
        call(command: string, params: Map<string, any>): Observable<any> {
            const cmd = this.commands.find(c => c.name == command);
            
            console.log(`${this.name}: executing ${command} with parameters ${params}`);

            if (cmd === undefined) {
                console.error(`${this.name}: unknown command ${command}`);
                return _throw(new Error(`Command ${command} not supported by device ${this.name}`));
            }
            
            let errors = Device.validateParameters(cmd, params);
            
            if (errors !== null) {
                let err = new Error(errors.map(err => err.message).join(', '));
                console.error(`${this.name}: invalid parameters: `, err);
                return _throw(err);
            }
            
            return fromPromise(cmd.handler(params));
        }
        
        /** Returns the description of the device or an empty string */
        get description(): string {
            return this._description || '';
        }
        
        /** Returns the current health state of the device */
        healthy(): DeviceHealthState {
            return this._health.getValue();
        }
        
        /** Returns a list of sensor definitions the device supports */
        getSensorSchemas(): SensorSchema[] {
            return this._sensors
                .map(s => ({
                    name: s.name,
                    description: s.description || '',
                    type: s.type,
                }));
        }

        watchSensors(): Observable<{[key: string]: any}> {
            return this._sensorValues.asObservable();
        }
        
        watchSensor(name: string): Observable<any> {
            if (this._sensors.find(s => s.name === name) === undefined) {
                return _throw(new Error(`Unknown sensor name`));
            }
            
            return this.watchSensors()
                .map(values => values[name]);
        }
        
        getSensorValues(): {[key: string]: any} {
            return this._sensorValues.getValue();
        }
        
        getSensorValue(name: string): any {
            if (this._sensors.find(s => s.name === name) === undefined) {
                throw new Error(`Unknown sensor name`);
            }
            
            return this.getSensorValues()[name];
        }
    
        private _updateSensorValue(sensor: SensorProvider, value: any): void {
            let state = {...this._sensorValues.getValue()};

            state[sensor.name] = value;
            
            this._sensorValues.next(state);
        }
        
        /**
         * Validates a parameter map against a schema definition
         * 
         * @param schema  The {@link CommandSchema} definition
         * @param args    The map containing the parameters for the call
         *
         * @returns A list of errors or null
         */
        static validateParameters(schema: CommandSchema, args: Map<string, any>): Error[]|null {
            let errors: Error[] = [];
            
            let iterator = args.entries();

            let item: IteratorResult<any>;
            
            const next = () => {
                item = iterator.next();
                return item.done;
            }
            
            // unfortunately typescript does not yet support
            // for .. of for iterators :/
            while(!next()) {
                const key = item.value[0];
                const value = item.value[1];

                const definition = schema.parameters[key];

                if (definition == undefined) {
                    errors.push(new Error(`Unkown parameter ${key} for command ${schema.name}`));
                    continue;
                }
                
                const types: ParameterType[] = definition instanceof Array ? definition : definition.types;
                
                if (types.includes(ParameterType.Any)) {
                    // Every type of parameter is allowed, skip checks
                    continue;
                }
                
                const isValidType = types.some(ptype => typeof value === ptype);
                
                if (!isValidType) {
                    errors.push(new Error(`Invalid type for parameter ${key} on command ${schema.name}`));
                    continue;
                }
            }
            
            // we also need to check if there are missing required parameters
            Object.keys(schema.parameters).forEach(parameterName => {
                const definition = schema.parameters[parameterName];
                const optional = Array.isArray(definition) ? false : definition.optional;

                if (!optional && !args.has(parameterName) === undefined) {
                    errors.push(new Error(`Missing required parameter ${parameterName} for command ${schema.name}`));
                }
            });
            
            if (errors.length == 0) {
                return null;
            }
            
            return errors;
        }
    };
    
}