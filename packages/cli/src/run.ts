import {Injector, resolveForwardRef, Type} from '@jsmon/core';
import {Runnable} from './interfaces';
import {resolveCommandTree, CommandTree} from './internal';
import {Parser, CommandContext} from './parser';
import {basename} from 'path';
import {OptionSettings} from './decorators';

/**
 * Run parses the given args (or uses process.argv) and executes the specified command by searching through
 * the {@type Runnable} class and all it's sub-commands. It may also serve help and version flags. Refer
 * to the {@type Command} decorator definitions for more information.
 * 
 * @param {Runnable} commandClass  - The class of the main command
 * @param {string[]} args - The command line flags to use. (default = process.argv) 
 * @param {Injector} parentInjector - An optional parent (root) injector to use. If none a new will be
 *                                    created
 */
export function run(commandClass: Type<Runnable>, args?: string[], parentInjector?: Injector): Promise<void> {
    if (args === undefined) {
        args = process.argv.slice(2);
    }

    const commandTree = resolveCommandTree(commandClass);
    
    // Add the help flag if desired
    if (commandTree.helpFlag !== null) {
        if (commandTree.helpFlag === undefined) {
            commandTree.helpFlag = "help,h";
        }
        
        let [long, short, ...rest] = commandTree.helpFlag.split(',');

        if (rest.length > 0) {
            throw new Error(`Invalid format for CommandSettings.helpFlag: ${commandTree.helpFlag}`);
        }
        
        commandTree.options['__help__'] = {
            name: long,
            short: short,
            description: 'Display this help text'
        }
    }
    
    // Add the version flag if desired
    if (commandTree.versionFlag !== null && !!commandTree.version) {
        if (commandTree.versionFlag === undefined) {
            commandTree.versionFlag = 'version';
        }
        
        let [long, short, ...rest] = commandTree.versionFlag.split(',');
        if (rest.length > 0) {
            throw new Error(`Invalid format for CommandSettings.versionFlag: ${commandTree.versionFlag}`);
        }
        
        commandTree.options['__version__'] = {
            name: long,
            short: short,
            description: 'Show the program version and exit'
        };
    }

    const contexts = Parser.parse(args, commandTree);
    const mainCommand = contexts[0];
    const finalCommand = contexts[contexts.length - 1];
    
    if (mainCommand.options['__help__']) {
        console.log(getHelpText(contexts));
        return Promise.resolve();
    }
    
    if (mainCommand.options['__version__']) {
        console.log(`${mainCommand.tree.version}`);
        return Promise.resolve();
    }
    
    const commands = createCommands(0, contexts, parentInjector);
    const final = commands[commands.length - 1];

    return final.instance.run();
}

interface CommandInstances {
    instance: Runnable;
    injector: Injector;
}

function createCommands(index: number, ctx: CommandContext[], parentInjector: Injector = new Injector([])): CommandInstances[] {
    let result: CommandInstances[] = [];
    const command = ctx[index];

    // We provide 2 aliases for the command so it can be injected as @Parent(), @Parent('command-name') or using @Inject()
    // within the ctor (see @jsmon/core/di)
    const injector = parentInjector.createChild([
        ... (command.tree.providers || []),
        command.tree.cls,
        {
            provide: '__PARENT__',
            useExisting: command.tree.cls
        },
        {
            provide: command.tree.name,
            useExisting: command.tree.cls,
        }
    ]);

    const cmdInstance: Runnable = injector.get(command.tree.cls);
    
    Object.keys(command.options)
        .forEach(propertyKey => {
            const value = command.options[propertyKey];
            (cmdInstance as any)[propertyKey] = value;
        });

    Object.keys(command.tree.parentProperties)
        .forEach(propertyKey => {
            let type: Type<Runnable>|string|null = resolveForwardRef(command.tree.parentProperties[propertyKey]!.type);
            let instance: Runnable;
            
            if (type === null) {
                instance = parentInjector.get<Runnable>('__PARENT__') ;
            } else {
                instance = injector.get<Runnable>(type);
            }

            (cmdInstance as any)[propertyKey] = instance;
        });
        
    Object.keys(command.tree.argProperties)
        .forEach(propertyKey => {
            (cmdInstance as any)[propertyKey] = command.args;
        });

    Object.keys(command.tree.parentFlags)
        .forEach(propertyKey => {
            const {name, direct} = command.tree.parentFlags[propertyKey]!;
            const limit = direct ? ctx.length -1 : -1;
            
            for(let i = index; i > limit; i--) {
                const cmd = ctx[i]!;

                const propKey = Object.keys(cmd.tree.options)
                    .find(key => {
                        return (cmd.tree.options[key].name === name);
                    })
                    
                if (!!propKey && cmd.options[propKey] !== undefined) {
                    (cmdInstance as any)[propertyKey] = cmd.options[propKey];
                }
            }
        });
    
    result.push({
        instance: cmdInstance,
        injector: injector,
    });

    if (ctx.length === index + 1) {
        return result;
    }

    const subCommands = createCommands(index + 1, ctx, injector);
    
    result = result.concat(...subCommands);
    
    return result;
}

function getHelpText(commands: CommandContext[]): string {
    const mainCommand = commands[0];
    const command = commands[commands.length - 1];

    const isMain = mainCommand === command;
    let str = '';
    
    str += `${getUsageString(commands)}\n\n`;
    
    if (isMain) {
        str += getCommandHelpHeader(command, true);
    } else if (!!command.tree.description) {
        str += command.tree.description + '\n\n';
    }

    if (!!command.tree.prolog) {
        str += '\n' + command.tree.prolog + '\n\n';
    }
    
    str += `${getSubCmdHelp(command)}`;
    
    str += `${getOptionsHelp(commands)}\n\n`;

    if (!!command.tree.epilog) {
        str += command.tree.epilog + '\n';
    }

    return str;
}

function getUsageString(commands: CommandContext[]): string {
    const command = commands[commands.length - 1];
    const main = commands[0];

    const hasOptions = commandHasOptions(commands);
    const hasSubcommand = commandHasSubcommands(command);
    let commandName = basename(process.argv[1]);
    
    if (command !== main) {
        for (let i = 1; i < commands.length; i++) {
            commandName += ' ' + commands[i].tree.name;
        }
    }

    let str = `Usage: ${commandName} ${hasSubcommand ? '[COMMANDS] ' : ''}${hasOptions ? '[...OPTIONS]' : ''}`;
    
    return str;
}

function getSubCmdHelp(command: CommandContext): string {
    if (!commandHasSubcommands(command)) { return ''; }
    
    let str = 'Commands:\n';
    
    command.tree.resolvedSubCommands
        .forEach(cmd => {
            const desc = !!cmd.description ? ' - ' + cmd.description : '';
            str += `   ${cmd.name}${desc}\n`
        });

    return str + '\n';
}

function getOptionsHelp(commands: CommandContext[]): string {
    const hasOptions = commandHasOptions(commands);
    if (!hasOptions) {
        return '';
    }
    
    const command = commands[commands.length - 1];
    
    return 'Options:\n' +
        Object.keys(command.tree.options)
            .map(key => {
                const opt = command.tree.options[key]!;
                return getFlagHelp(opt);
            })
            .join('\n');
}

function getFlagHelp(opt: OptionSettings): string {
    let str = `--${opt.name}`;
    if (!!opt.short) {
        str += `/-${opt.short}`;
    }
    
    // TODO(ppacher): support configuring the placeholder for the VALUE
    if (!!opt.argType && opt.argType !== 'boolean') {
        str += ' VALUE'
    }

    if (!!opt.description) {
        str += `\t\t${opt.description}`;
    }
    
    if (!!opt.default) {
        str += ` (default: ${opt.default})`;
    }
    
    return `   ${str}`;
}

function getCommandHelpHeader(command: CommandContext, isMain: boolean): string {
    const version = isMain && !!command.tree.version ? ` [${command.tree.version}]` : '';
    return `\
${command.tree.name}${version}${!!command.tree.description ? ' - ' + command.tree.description : ''}
`;    
}

function commandHasSubcommands(command: CommandContext): command is CommandContext&{tree: {resolvedSubCommands: CommandContext[]}} {
    return !!command.tree.resolvedSubCommands && command.tree.resolvedSubCommands.length > 0;
}

function commandHasOptions(commands: CommandContext[]): boolean {
    let hasOptions = Object.keys(commands[0].tree.options).length > 0;
    if (!hasOptions) {
        // if the command doesn't have options itself check if there are 
        // any parent options
        // TODO(ppacher): add a flag to include parent-options in the help output 
        hasOptions = commands.slice(1).some(cmd => {
            return Object.keys(cmd.tree.options).length > 0;
        });
    }
    return hasOptions;
}