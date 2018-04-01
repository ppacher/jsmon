import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {_throw} from 'rxjs/observable/throw';
import {fromPromise} from 'rxjs/observable/fromPromise';
import {subscribeOn} from 'rxjs/operator/subscribeOn';
import {of} from 'rxjs/observable/of';
import {isPromiseLike} from '@homebot/core/utils/utils';

import {DeviceHealthState, HealthCheck, ParameterType, CommandSchema, SensorSchema, SensorProvider} from './device';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';

// BUG(ppacher): we need to include rx operators in homebot/common
// including them in example doesn't work -_-
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/filter';

/**
 * @class Device
 * 
 * @description
 * Describes how the device manager should handle and register commands
 * of a device
 */
export class DeviceController<T = any> {
    private _health: BehaviorSubject<DeviceHealthState> = new BehaviorSubject<DeviceHealthState>(DeviceHealthState.Unknown);
    private _sensorValues: BehaviorSubject<{[key:string]: any}> = new BehaviorSubject<{[key:string]:any}>({});
    
    constructor(
        /** The name of the device */
        public readonly name: string,
        
        public readonly instance: T,

        /** A list of commands supported by the device */
        public readonly commands: ReadonlyArray<CommandSchema>,
        
        private _sensors: SensorProvider[],
        
        /** An optional health check function, defaults to DeviceHealthState.Unknown */
        private _checkHealth: HealthCheck = () => of(DeviceHealthState.Unknown),
        
        /** An optional description of the device */
        private _description: string = '',
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
        
        if (cmd === undefined) {
            return _throw(new Error(`Command ${command} not supported by device ${this.name}`));
        }
        
        let errors = DeviceController.validateParameters(cmd, params);
        
        if (errors !== null) {
            let err = errors.map(err => err.message).join(', ');
            return _throw(err);
        }

        return fromPromise(
            cmd.handler.apply(this.instance, [params])
        );
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
        return this._sensorValues.asObservable()
            .distinctUntilChanged()
            .debounceTime(100);
    }
    
    watchSensor(name: string): Observable<any> {
        if (this._sensors.find(s => s.name === name) === undefined) {
            return _throw(new Error(`Unknown sensor name: ${name}`));
        }
        
        return this.watchSensors()
            .map(values => values[name])
            .distinctUntilChanged()
            .debounceTime(100);
    }
    
    getSensorValues(): {[key: string]: any} {
        return this._sensorValues.getValue();
    }
    
    getSensorValue(name: string): any {
        if (this._sensors.find(s => s.name === name) === undefined) {
            throw new Error(`Unknown sensor name: ${name}`);
        }
        
        return this.getSensorValues()[name];
    }

    private _updateSensorValue(sensor: SensorProvider, value: any): void {
        const old = this._sensorValues.getValue()[sensor.name];
        const changed = old !== value;

        if (!changed) {
            return;
        }
        
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
        
        let hasArgs = args.size > 0;

        if (!schema.parameters || Object.keys(schema.parameters).length === 0) {
            if (!hasArgs) {
                return null;
            }
            
            return [new Error(`unexpected parameters`)];
        }
        
        const next = () => {
            item = iterator.next();
            return item.done;
        }
        
        // unfortunately typescript does not yet support
        // for .. of for iterators :/
        while(!next()) {
            const key = item!.value[0];
            const value = item!.value[1];

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
            
            const arrayTypes = [
                ParameterType.Array,
                ParameterType.BooleanArray,
                ParameterType.NumberArray,
                ParameterType.ObjectArray,
                ParameterType.StringArray
            ];
            const isArrayType = (p: ParameterType) =>  arrayTypes.includes(p);
            const isValidArray = (p: ParameterType) => {
                if (!Array.isArray(value)) {
                    return false;
                }
                
                switch (p) {
                    case ParameterType.Array:
                        return true;
                    case ParameterType.BooleanArray:
                        return value.some(v => !(typeof v === 'boolean'));
                    case ParameterType.NumberArray:
                        return value.some(v => !(typeof v === 'number'));
                    case ParameterType.ObjectArray:
                        return value.some(v => !(typeof v === 'object'));
                    case ParameterType.StringArray:
                        return value.some(v => !(typeof v === 'string'));
                }
                
                return false;
            };

            const isValidType = types.some(ptype => {
                if (isArrayType(ptype)) {
                    return isValidArray(ptype);
                }

                return typeof value === ptype;
            });
            
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