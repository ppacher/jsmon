import {Type, PROP_METADATA, ANNOTATIONS, resolveForwardRef} from '@jsmon/core';
import {Option, OptionSettings, Command, CommandSettings, Parent, ForwardRef} from './decorators';
import {Runnable} from './interfaces';

export type PropertyOptions<T> = {
    [K in keyof T]?: OptionSettings;
}

export type ParentProperties<T> = {
    [K in keyof T]?: Parent;
}

export interface CommandTree extends CommandSettings {
    options: PropertyOptions<any>;
    cls: Type<Runnable>;
    resolvedSubCommands?: CommandTree[];
    parentProperties: ParentProperties<any>;
}

export function resolveCommandTree(cls: Type<Runnable>, knownLongOptions: string[] = [], knownShortOptions: string[] = []): CommandTree {
    const command = getRunnableAnnotations(cls);
    const options = getRunnableOptions(cls);
    const parentProperties = getRunnableParentProperties(cls);
    
    Object.keys(options).forEach(key => {
        let longName = (options as any)[key]!.name;
        let shortName = (options as any)[key]!.short;
        
        if (knownLongOptions.includes(longName)) {
            throw new Error(`Parameter with name --${longName} is already defined`)
        }
        knownLongOptions.push(longName);
        
        if (!!shortName && knownShortOptions.includes(shortName)) {
            throw new Error(`Parameter with name -${shortName} is already defined`)
        } else if (!!shortName) {
            knownShortOptions.push(shortName);
        }
    })

    const tree: CommandTree = {
        ...command,
        options: options,
        cls: cls,
        resolvedSubCommands: [],
        parentProperties: parentProperties,
    };
    
    if (!!command.subcommands) {
        tree.resolvedSubCommands = command.subcommands.map(subcls => resolveCommandTree(subcls, knownLongOptions, knownShortOptions));
    }
    
    return tree;
}

export function getRunnableAnnotations(d: Type<Runnable>): CommandSettings {
    const annotations = Object.getOwnPropertyDescriptor(d, ANNOTATIONS);
    if (annotations === undefined) {
        throw new Error(`Missing @Command() decorator on ${d.name}`);
    }
    
    const settings: Command[] = annotations.value.filter((a: any) => a instanceof Command);

    if (settings.length === 0) {
        throw new Error(`Missing @Command() decorator on ${d.name}`);
    }
    
    if (settings.length > 1) {
        throw new Error(`@Command() decorator is used multiple times on ${d.name}`);
    }
    
    return settings[0].settings;
}

export function getRunnableOptions<T>(d: Type<T>): PropertyOptions<T> {
    const annotations = Object.getOwnPropertyDescriptor(d, PROP_METADATA);
    if (annotations === undefined) {
        return {};
    }
    
    const options: any = {}; 
    
    Object.keys(annotations.value)
        .forEach(key => {
            const opt: Option[] = annotations.value[key].filter((o: any) => o instanceof Option);
            
            if (opt.length === 0) {
                return;
            }

            if (opt.length > 1) {
                throw new Error(`@Option decorator is used multiple times on ${d.name}.${key}`);
            }

            options[key] = opt[0].settings;
        });
    
    return options;
}

export function getRunnableParentProperties<T extends Runnable>(d: Type<T>): ParentProperties<T> {
    const annotations = Object.getOwnPropertyDescriptor(d, PROP_METADATA);
    if (annotations === undefined) {
        return {};
    }
    
    const properties: any = {}; 
    
    Object.keys(annotations.value)
        .forEach(key => {
            const opt: Parent[] = annotations.value[key].filter((o: any) => o instanceof Parent);
            
            if (opt.length === 0) {
                return;
            }

            if (opt.length > 1) {
                throw new Error(`@Option decorator is used multiple times on ${d.name}.${key}`);
            }

            properties[key] = opt[0];
        });
    
    return properties;
}