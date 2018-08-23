import {Injector, Inject, forwardRef} from '@jsmon/core';
import {Command, Option, Parent, Args, ParentFlag} from '../decorators';
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
    
    // This gets the value for a parents' verbose flag injected (by option name)
    @ParentFlag('verbose')
    public verbose: boolean = false;
    
    // This gets all additional arguments injected
    @Args()
    public args: string[] = [];

    // Like below, a definition for a command line option/flag
    @Option({name: 'count', short: 'c', argType: 'number', description: 'An abriatray count'})
    public count: number = 0;
    
    @Option({name: 'num', short: 'n', argType: 'number', multiple: true, description: 'One ore more numbers'})
    public num: number[] = [];
    
    
    async run() {
        console.log(`simple.verbose=${this.simple!.verbose}`);
        console.log(`verbose=${this.verbose}`);
        console.log(`list.long=${this.list!.long}`);
        console.log(`count=${this.count}`);
        console.log(`args="${JSON.stringify(this.args)}"`)
        console.log(`num=${JSON.stringify(this.num)}`);
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