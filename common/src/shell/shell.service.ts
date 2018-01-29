import {Injectable, Inject} from '@homebot/core';
import {Writable, Readable} from 'stream';

export abstract class CommandRef {
    /** Wait for the execute to finish */
    abstract wait(): Promise<this>;

    /** Returns a readable stream from the commands stdout */
    abstract stdout(): Readable;

    /** Returns a readable stream from the commands stderr */
    abstract stderr(): Readable;
    
    /** Returns a writeable stream to the commands stdin */
    abstract stdin(): Writable;

    /** Kills the current command and resolves/rejects the returned promise */
    abstract kill(): Promise<this>;
    
    abstract get code(): number|null;
}

export abstract class ShellAdapter {
    /**
     * Execute a command
     *
     * @example     adapter.execute('ls').wait().then(ref => ref.stdout())
     */
    abstract run(cmd: string, args?: string[]): CommandRef;
}

@Injectable()
export class ShellService implements ShellAdapter{
    constructor(private _adapter: ShellAdapter) {}
    
    run(cmd: string, args?: string[]): CommandRef {
        return this._adapter.run(cmd, args);
    }
}

