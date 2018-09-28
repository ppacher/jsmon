import {makeDecorator, ForwardRef, makePropDecorator, Type, Provider} from '@jsmon/core';
import {Runnable} from '../interfaces';

/**
 * Settings for the @Command() decorator
 */
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
    
    /** An optional list of dependency injection providers that will also be propagated to sub-commands */
    providers?: Provider[]; 
    
    /** An optional list of plugins */
    imports?: Type<any>[];
}

/** The type of the Command decorator */
export interface CommandDecorator {
    (settings: CommandSettings): any;
    new (settings: CommandSettings): Command;
}

/** The annotation type of the @Command decorator  */
export interface Command {
    settings: CommandSettings;
}

/**
 * Use the @Command() decorator to mark Runnable classes as @jsmon/cli commands
 * See {@type CommandSettings} for available decorator options 
 */
export const Command: CommandDecorator = makeDecorator('Command', (settings: CommandSettings) => ({settings}));

/** The annoation type of the @Parent decorator */
export interface Parent {
    type: Type<Runnable>|string|ForwardRef<Runnable>|null;
}

/**
 * The Parent decorator injects a parent command into the decorated property
 * If `type` is null, the direct parent will be injected. Otherwise, the specified parent
 * (either by type or command name) is injected
 */
export interface ParentCommandDecorator {
    (type?: Type<Runnable>|string|ForwardRef<Runnable>): any;
    new (type?: Type<Runnable>): Parent;
}

/** The @Parent decorator. See {@link ParentCommandDecorator} for more information */
export const Parent: ParentCommandDecorator = makePropDecorator('Parent', (type?: Type<Runnable>) => {
    return {
        type: type || null
    };
});

export interface Args {}

export interface ArgsDecorator {
    (): any;
    new (): Args;
}

export const Args: ArgsDecorator = makePropDecorator('Args');

export interface ParentFlag {
    name: string;
    direct?: boolean;
}

export interface ParentFlagDecorator {
    (name: string, direct?: boolean): any;
    new (name: string, direct?: boolean): ParentFlag;
}

export const ParentFlag: ParentFlagDecorator = makePropDecorator('Flags', (name, direct) => ({name, direct}))