import {Injectable} from '@homebot/core';
import {ShellAdapter, CommandRef} from './shell.service';

import {spawn, ChildProcess} from 'child_process';
import {Readable, Writable} from 'stream';

export class LinuxCommandRef extends CommandRef {
    private _process: ChildProcess;
    private _code: number|null = null;

    constructor(process: ChildProcess) {
        super();
        
        this._process = process;

        this._process.on('close', code => this._code = code);
    }
    
    stderr(): Readable {
        return this._process.stderr;
    }
    
    stdout(): Readable {
        return this._process.stdout;
    }
    
    stdin(): Writable {
        return this._process.stdin;
    }
    
    kill(): Promise<this> {
        return new Promise<this>((resolve, reject) => {
            this._process.on('close', (code) => {
                resolve(this);
            });

            this._process.kill();
        });
    } 
    
    wait(): Promise<this> {
        return new Promise<this>((resolve, reject) => {
            this._process.on('close', () => resolve(this));
        });
    }

    get code(): number|null {
        return this._code;
    }
}

@Injectable()
export class LinuxShellAdapter extends ShellAdapter {
    run(cmd: string, args?: string[]): CommandRef {
        let child = spawn(cmd, args);
        return new LinuxCommandRef(child);
    }
}