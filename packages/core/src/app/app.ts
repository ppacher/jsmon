import {Provider} from '../di';
import {makeDecorator} from '../utils/decorator';

/**
 * Definition of a command-line parameter/flag
 */
export interface FlagDescriptor {
    /* The name of the command-line flag */
    name: string;
    
    /* A short character for the flag */
    short?: string;
    
    /* An optional description of the command-line flag. May include newlines */
    description?: string;

    /* Wether or not the command-line flag is required */
    required?: boolean;
    
    /* Wether or not the flag can be specified multiple times */
    multiple?: boolean;

    /** Wether or not the flag is a boolean value and does not require a value */
    boolean?: boolean;
}

export interface AppDescriptor {
    /* A set of providers that should be added to the root injector */
    providers?: Provider[];
    
    /* A list of plugins that should be bootstrapped with the application */
    plugins?: any[];
    
    /* A list of command-line flags supported by the application */
    flags?: FlagDescriptor[];
}

export interface AppDecorator {
    (settings: AppDescriptor): any;
    new (settings: AppDescriptor): App;
}

export interface App {
    settings: AppDescriptor;
}

export const App: AppDecorator = makeDecorator('App', (settings) => ({settings}));