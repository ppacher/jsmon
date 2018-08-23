import {Injector, Inject, forwardRef} from '@jsmon/core';
import {Command, Option, Parent} from '../decorators';
import {Runnable} from '../interfaces';
import {run} from '../run';

@Command({name: 'remote'})
export class ListRemoteCommand implements Runnable {

    // Get a specific parent command injected, we need to use forwardRef from @jsmon/core
    // as SimpleCommand is not yet defined
    @Parent(forwardRef(() => SimpleCommand))
    public simple: SimpleCommand|undefined;
    
    // This gets a parent command injected by it's name
    @Parent('list')
    public list: ListCommand|undefined;
    
    @Option({name: 'count', short: 'c', argType: 'number'})
    public count: number = 0;
    
    async run() {
        if (this.simple!.verbose) {
            console.log(`Verbose output enabled`);
        } else {
            console.log('Verbose output disabled');
        }
        
        if (this.list!.long) {
            console.log(`Long output enabled`);
        } else {
            console.log('Long output disabled');
        }
        
        console.log(`Count is ${this.count}`);
    }
}

@Command({name: 'list', description: 'Display a list of modified files', subcommands: [ListRemoteCommand]})
export class ListCommand implements Runnable {
    @Option({name: 'long', short: 'l', description: 'Use long output format'})
    public long: boolean = false;
    
    @Parent()
    public parent: SimpleCommand|undefined;
    
    async run() {
        if (this.parent!.verbose) {
            console.log(`Verbose output enabled`);
        } else {
            console.log('Verbose output disabled');
        }
        
        if (this.long) {
            console.log(`Long output enabled`);
        } else {
            console.log('Long output disabled');
        }
    }
}

@Command({
    name: 'simple',
    version: '0.1-alpha',
    description: 'Demostration app for @jsmon/cli',
    subcommands: [ListCommand],
    prolog: `A simple application demonstrating the use of @jsmon/cli.`,
    epilog: 'It is also possible to display a predefined text below the command flags help text'
})
export class SimpleCommand implements Runnable {

    @Option({name: 'verbose', short: 'v', description: 'Display verbose output'})
    public verbose: boolean = false;
    
    constructor() {}
    
    async run() {
        if (this.verbose) {
            console.log(`Verbose output enabled`);
        } else {
            console.log('Verbose output disabled');
        }
    }
}

run(SimpleCommand);

// node simple.js list remote --verbose --long