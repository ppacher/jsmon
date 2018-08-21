import {Injector, Type} from '@jsmon/core';
import {Runnable} from './interfaces';
import {resolveCommandTree, CommandTree} from './internal';
import {Parser, CommandContext} from './parser';

export function run(commandClass: Type<Runnable>, args?: string[]): Promise<void> {
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
        };
    }

    const contexts = Parser.parse(args, commandTree);
    const mainCommand = contexts[0];
    
    if (mainCommand.options['__help__']) {
        console.log(`Displaying help`);
        return Promise.resolve();
    }
    
    if (mainCommand.options['__version__']) {
        console.log(`${mainCommand.tree.version}`);
        return Promise.resolve();
    }
    
    const commands = createCommands(contexts);
    const final = commands[commands.length - 1];

    return final.instance.run();
}

interface CommandInstances {
    instance: Runnable;
    injector: Injector;
}

function createCommands(ctx: CommandContext[], parentInjector: Injector = new Injector([])): CommandInstances[] {
    let result: CommandInstances[] = [];
    const command = ctx[0];

    const injector = parentInjector.createChild([
        ... (command.tree.providers || []),
        command.tree.cls,
        {
            provide: '__PARENT__',
            useExisting: command.tree.cls
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
            let type: Type<Runnable>|null = command.tree.parentProperties[propertyKey]!;
            let instance: Runnable;
            
            if (type === null) {
                instance = parentInjector.get<Runnable>('__PARENT__') ;
            } else {
                instance = injector.get(type);
            }
            (cmdInstance as any)[propertyKey] = instance;
        });
    
    result.push({
        instance: cmdInstance,
        injector: injector,
    });

    if (ctx.length === 1) {
        return result;
    }

    const subCommands = createCommands(ctx.splice(1), injector);
    
    result = result.concat(...subCommands);
    
    return result;
}
