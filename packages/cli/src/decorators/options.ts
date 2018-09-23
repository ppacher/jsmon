import {makePropDecorator} from '@jsmon/core';

export interface OptionSettings {
    /** The name of the option */
    name: string;
    
    /** An optional short name for the option. Must only be one character */
    short?: string;
    
    /** An optional description for the command */
    description?: string;
    
    /** Wether or not the command expects arguments. Defaults to boolean */
    argType?: null|'string'|'number'|'boolean';
    
    /** Wether or not the option can be specified multiple times */
    multiple?: boolean;
    
    /** Wether or not the option must be specified on the command line */
    required?: boolean;
}

export interface OptionDecorator {
    (settings: OptionSettings): any;
    new (settings: OptionSettings): Option;
}

export interface Option {
    settings: OptionSettings;
}

export const Option: OptionDecorator = makePropDecorator('Option', (settings: OptionSettings) => ({settings}));