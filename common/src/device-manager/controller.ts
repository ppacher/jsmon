import {Observable} from 'rxjs/Observable';
import {_throw} from 'rxjs/observable/throw';
import {fromPromise} from 'rxjs/observable/fromPromise';

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

    /** 
     * Definition of a HealthCheck function that returns the current state of
     * a device. 
     *
     * Note that implementations are allowed to cache the value and return the last
     * known state when polled on a regular interval
     */
    export interface HealthCheck {
        (): DeviceHealthState;
    }
    
    /**
     * @class Device
     * 
     * @description
     * Describes how the device manager should handle and register commands
     * of a device
     */
    export class Device {
        constructor(
            /** The name of the device */
            public name: string,

            /** A list of commands supported by the device */
            public commands: CommandSchema[],
            
            /** An optional health check function, defaults to DeviceHealthState.Unknown */
            private _checkHealth: HealthCheck = () => DeviceHealthState.Unknown,
            
            /** An optional description of the device */
            private _description: string = ''
        ) {}
        
        /**
         * Executes a command with the provided arguments and returns
         * and observable that emits the results when available
         *
         * @param command   The name of the command to execute
         * @param args      Additional arguments to pass to the command
         */
        call(command: string, params: Map<string, any>): Observable<any> {
            const cmd = this.commands.find(c => c.name == command);

            if (cmd === undefined) {
                return _throw(new Error(`Command ${command} not supported by device ${this.name}`));
            }
            
            let errors = Device.validateParameters(cmd, params);
            
            if (errors !== null) {
                throw new Error(errors.map(err => err.message).join(', '));
            }
            
            return fromPromise(cmd.handler(params));
        }
        
        /** Returns the description of the device or an empty string */
        get description(): string {
            return this._description || '';
        }
        
        /** Returns the current health state of the device */
        healthy(): DeviceHealthState {
            if (this._checkHealth) {
                return this._checkHealth();
            }
            
            return DeviceHealthState.Unknown;
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
            
            // unfortunately typescript does not yet support
            // for .. of for iterators :/
            item = iterator.next();
            while(!item.done) {
                const key = item.value[0];
                const value = item.value[1];
                
                // Get the next value ASAP
                item = iterator.next();
                
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

                if (!optional && args[parameterName] === undefined) {
                    errors.push(new Error(`Missing required parameter ${parameterName} form command ${schema.name}`));
                }
            });
            
            if (errors.length == 0) {
                return null;
            }
            
            return errors;
        }
    };
}