import {Type, PROP_METADATA, ANNOTATIONS, resolveForwardRef} from '@jsmon/core';
import {Option, OptionSettings, Command, CommandSettings, Parent, Args, ParentFlag} from './decorators';
import {Runnable} from './interfaces';

export type PropertyOptions<T> = {
    [K in keyof T]: OptionSettings;
}

export type ArgProperties<T> = {
    [K in keyof T]: Args;
}

export type ParentProperties<T> = {
    [K in keyof T]: Parent;
}

export type ParentFlagProperties<T> = {
    [K in keyof T]: ParentFlag;
}
export interface InjectionTarget<T> {
    parent: ParentProperties<T>;
    args: ArgProperties<T>;
    parentFlags: ParentFlagProperties<T>;
}

export interface CommandTree extends CommandSettings {
    options: PropertyOptions<any>;
    cls: Type<Runnable>;
    resolvedSubCommands?: CommandTree[];
    parentProperties: {[key: string]: Parent};
    argProperties: {[key: string]: Args};
    parentFlags: {[key: string]: ParentFlag};
}

export function resolveCommandTree(cls: Type<Runnable>, knownLongOptions: string[] = [], knownShortOptions: string[] = []): CommandTree {
    const command = getRunnableAnnotations(cls);
    const options = getRunnableOptions(cls);
    const propTargets = getRunnableInjectionTargets(cls);
    
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
        parentProperties: propTargets.parent,
        argProperties: propTargets.args,
        parentFlags: propTargets.parentFlags,
    };
    
    if (!!command.subcommands) {
        
        tree.resolvedSubCommands = command.subcommands.map(subcls => {
            const currentShortOptions = [...knownShortOptions];
            const currentLongOptions = [...knownLongOptions];
            return resolveCommandTree(subcls, currentLongOptions, currentShortOptions);
        });
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
        return {} as any;
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

export function getRunnableInjectionTargets<T extends Runnable>(d: Type<T>): InjectionTarget<T> {
    const annotations = Object.getOwnPropertyDescriptor(d, PROP_METADATA);
    if (annotations === undefined) {
        return {
            parent: {} as any,
            parentFlags: {} as any,
            args: {} as any,
        };
    }
    
    const properties: InjectionTarget<T> = {
        args: {} as any,
        parent: {} as any,
        parentFlags: {} as any
    }; 
    
    Object.keys(annotations.value)
        .forEach(key => {
            const opt: any = annotations.value[key].filter((o: any) => {
                return o instanceof Parent
                        || o instanceof Args
                        || o instanceof ParentFlag;
            });
            
            if (opt.length === 0) {
                return;
            }
            
            const annotation = opt[0];
            let typeName = '';
            let prop = '';
            
            if (annotation instanceof Parent) {
                typeName = 'Parent';
                prop = 'parent';
            } else if (annotation instanceof Args) {
                typeName = 'Args;'
                prop = 'args';
            } else if (annotation instanceof ParentFlag) {
                typeName = 'ParentFlag';
                prop = 'parentFlags';
            }
            
            if (opt.length > 1) {
                throw new Error(`@${typeName} decorator is used multiple times on ${d.name}.${key}`);
            }

            (properties as any)[prop][key] = opt[0];
        });
    
    return properties;
}