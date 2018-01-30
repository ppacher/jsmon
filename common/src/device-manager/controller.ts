
export namespace Device {
    /** Available types for command paramters */
    export enum ParameterType {
        String = 'string',
        Number = 'number',
        Boolean = 'boolean',
        Object = 'object',
        Any = 'any'
    };
    
    export interface ParameterDefinition {
        /** A list of accepted parameter types */
        types: ParameterType[]
        
        /** An optional help text for the parameter */
        help?: string;
        
        /** Wether or not the parameter is optional. Defaults to false */
        optional?: boolean;
    }

    export interface CommandSchema {
        /** the name of the command */
        name: string;
        
        /** Parameter definitions and their accepted type */
        parameters: {
            [key: string]: ParameterDefinition|ParameterType[];
        };
        
        /** The handle function to invoke for the command */
        handler: (...args: any[]) => any;
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
            
            /** An optional description of the device */
            public description: string = ''
        ) {}
    };
}