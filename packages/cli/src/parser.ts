import {Type} from '@jsmon/core';
import {CommandTree} from "./internal";
import {Runnable} from "./interfaces";
import {OptionSettings} from './decorators';

export interface CommandContext {
    options: {
        [propertyKey: string]: any;
    }
    args?: string[];
    tree: CommandTree;
}

export class Parser {
    public static parse(args: string[], commandTree: CommandTree): CommandContext[] {
        let currentTree: CommandTree = commandTree;
        let commandPath: string[] = [];
        let currentArgs: string[] = [];

        let result: CommandContext[] = [{
            options: {},
            args: [],
            tree: currentTree,
        }];
        
        for (let i = 0; i < args.length; i++) {
            const flag = args[i];

            if (!flag.startsWith('-')) {
                // check if this is a sub-command
                let nextTree: CommandTree|undefined;

                if (!!currentTree.resolvedSubCommands) {
                    nextTree = currentTree.resolvedSubCommands.find(cmd => cmd.name === flag);
                }
                
                if (!!nextTree) {
                    currentArgs = [];
                    currentTree = nextTree;
                    commandPath.push(nextTree.name);
                    
                    result.push({
                        options: {},
                        args: currentArgs,
                        tree: currentTree,
                    });
                }  else {
                    currentArgs.push(flag);
                }
            } else {
                let [cmdIdx, def, name, value, isMissing] = Parser._parseFlag(flag, result);
                
                if (isMissing) {
                    if (i === args.length -1) {
                        throw new Error(`Missing argument for flag --${def.name}`);
                    }
                    i++;
                    let next = args[i];
                    
                    if (next.startsWith('-')) {
                        throw new Error(`Missing argument for flag --${def.name}`);
                    }
                    
                    [value, isMissing] = Parser._convertValue(next, def);
                    if (isMissing) {
                        throw new Error(`Missing argument for flag --${def.name}`);
                    }
                }
                
                let values = result[cmdIdx].options[name];

                if (def.multiple) {
                    values = values || [];
                    
                    if (value !== '') {
                        values.push(value);
                    }
                } else {
                    if (!!values) {
                        throw new Error(`Flag ${name} specified multiple times: ${JSON.stringify(values)}`);
                    }
                    values = value;
                }
                
                result[cmdIdx].options[name] = values;
            }
        }
        
        return result;
    } 

    private static _parseFlag(flag: string, commands: CommandContext[]): [number, OptionSettings, string, any, boolean] {
        let flagParts: string[] = [];
        let flagName = '';
        let flagValue: string|null = null;
        
        let isLongOption = flag.startsWith('--');

        if (flag.includes('=')) {
            flagParts = flag.split('=');
            
            flagName = flagParts[0].slice(isLongOption ? 2 : 1);
            
            if (!isLongOption && flagName.length > 1) {
                throw new Error(`Invalid flag specified: ${flagName}`);
            }
            
            if (flagParts[1] === '') {
                throw new Error(`Invalid argument for ${flagName}`);
            }                    
            
            flagValue = flagParts.slice(1).join('=');
        } else {
            flagName = flag.slice(isLongOption ? 2 : 1);
            /* TODO(ppacher): should we support -vtrue as an alias for (--verbose=true, -v=true)
            if (!isLongOption) {
                flagValue = flagName.slice(1);
                flagName = flagName[0];
            }
            */
        }
                
        // check if this is a valid flag for our current or any parent command
        let actualFlagName: string|undefined = undefined;
        let optionDef: OptionSettings|undefined = undefined;

        let i = 0;
        for(i = 0; i < commands.length; i++) {
            let iter = commands[i];
            actualFlagName = Object.keys(iter.tree.options)
                .find(key => {
                    let option = iter.tree.options[key]!;
                    if (!option) {
                        return false;
                    }
                    
                    if (isLongOption) {
                        return option.name === flagName;
                    }
                    
                    return option.short === flagName;
                });
                
            if (actualFlagName !== undefined) {
                optionDef = iter.tree.options[actualFlagName];
                break;
            }
        }
        
        if (actualFlagName === undefined) {
            throw new Error(`Unknown flag ${isLongOption ? '--' : '-'}${flagName} for command "${commands.map(c => c.tree.name).join('->')}"`);
        }
        const [value, isMissing] = Parser._convertValue(flagValue, optionDef!);
        
        return [i, optionDef!, actualFlagName, value, isMissing];
    }
    
    private static _convertValue(flagValue: string|null, opt: OptionSettings): [any, boolean] {
        // Check if we are missing the flagValue
        if (!!opt.argType && opt.argType !== 'boolean' && flagValue === null) {
            return [null, true];
        }

        if (opt.argType === 'string') {
            return [flagValue, false];
        }
        
        if (opt.argType === 'number') {
            let num = parseInt(flagValue!);
            if (isNaN(num)) {
                throw new Error(`Expected a number for flag --${opt.name} but got ${flagValue}`);
            }
            return [parseInt(flagValue!), false];
        }
        
        if (!['0', '1', 'true', 'false', 't', 'f', null].includes(flagValue)) {
            throw new Error(`Invalid value for boolean flag --${opt.name}: "${flagValue}"`)
        }
        
        // Boolean
        if (flagValue === 'false' || flagValue === '0') {
            return [false, false];
        }

        return [true, false];
    }
}