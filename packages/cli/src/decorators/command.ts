import {makeDecorator, makePropDecorator, Type, Provider, Inject} from '@jsmon/core';
import {Runnable} from '../interfaces';

export interface CommandSettings {
    /** The name of the command */
    name: string;

    /** An optional version of the command, only valid for the top-parent command */
    version?: string;
    
    /** A short description for the command */
    description?: string;
    
    /** A longer prolog text displayed before the command and options help */
    prolog?: string; 
    
    /** A longer epilog text displayed after the command and options help */
    epilog?: string;
    
    /** The help flag to use, defaults to --help,-h. Set to null to disable built-in help text generation */
    helpFlag?: string|null;
    
    /** The version flag to use, default to --version,-v. Set to null to disable the built-in version command */
    versionFlag?: string|null;

    /** An optional list of sub-commands */
    subcommands?: Type<Runnable>[];
    
    /** An optional list of dependecy providers that will also be propagated to sub-commands */
    providers?: Provider[]; 
}

export interface CommandDecorator {
    (settings: CommandSettings): any;
    new (settings: CommandSettings): Command;
}

export interface Command {
    settings: CommandSettings;
}

export const Command: CommandDecorator = makeDecorator('Command', (settings: CommandSettings) => ({settings}));


export interface ParentCommand {
    type: Type<Runnable>|null;
}

export interface ParentCommandDecorator {
    (type?: Type<Runnable>): any;
    new (type?: Type<Runnable>): ParentCommand;
}

export const ParentCommand: ParentCommandDecorator = makePropDecorator('ParentCommand', (type?: Type<Runnable>) => {
    return {
        type: type || null
    };
});