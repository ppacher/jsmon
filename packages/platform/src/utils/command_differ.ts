import {IterableDiffer, IterableChanges, IterableChangeRecord, createIterableDiffer} from '@homebot/core';
import {ICommandDefinition, IParameterDefinition, ParameterType} from '../devices';

export interface ParameterChangeRecord {
    trackById: string;
    name: string;
    item: IParameterDefinition|ParameterType[];
}

class ParameterChangeRecord_ implements ParameterChangeRecord {
    constructor(
        public readonly trackById: string,
        public readonly name: string,
        public readonly item: IParameterDefinition,
    ) {}
}

/**
 * Describes a list of changes between two sets of {@link Parameter}
 */
export interface ParameterChanges {
    /**
     * Invokes the callback function for each new parameter
     */
    forEachNewParameter(cb: (record: ParameterChangeRecord)=>void): void;
    
    /**
     * Invokes the callback function for each deleted parameter
     */
    forEachDeletedParameter(cb: (record: ParameterChangeRecord)=>void): void;
    
    /**
     * Invokes the callback function for each changed parameter
     */
    forEachChangedParameter(cb: (record: ParameterChangeRecord, old: IParameterDefinition|ParameterType[])=>void): void;
}

export interface CommandChanges extends ParameterChanges {
    /** Wether or not the command's parameters have changed */
    hasParametersChanged(): boolean;
    
    /** Wether or not the command's description has changed */
    hasDescriptionChanged(): boolean; 
}

export type Parameter = [string, IParameterDefinition|ParameterType[]];


/**
 * A {@link @homebot/core:TrackByFunction} from {@link ICommandDefinition}
 */
export function CommandTrackByFunction(idx: number, cmd: ICommandDefinition): string {
    return cmd.name!;
}

export interface ParameterDiffer {
    diff(parameters: IParameterDefinition[]): ParameterChanges|null;
}

export interface CommandDiffer {
    diff(cmd: ICommandDefinition): CommandChanges|null;
}

function ParameterTrackByFunction(idx: number, def: IParameterDefinition) {
    return def.name! as string;
} 

class ParameterDiffer_ implements ParameterDiffer, ParameterChanges {
    private _iterableParameterDiffer = createIterableDiffer(ParameterTrackByFunction);
    private _changes: IterableChanges<IParameterDefinition>|null = null;
    private _parameterChangeRecord: [ParameterChangeRecord, IParameterDefinition|ParameterType[]][] = [];

    diff(params: IParameterDefinition[]): ParameterChanges|null {
        this._parameterChangeRecord = [];

        this._changes = this._iterableParameterDiffer.diff(params);
        
        if (this._changes === null) {
            return null;
        }

        // since we are mapping all object keys to {@link Parameter} we 
        // will get all parameters as "changed"
        this._changes!.forEachIdentityChanged((record, old) => {
            let isDifferent = false;

            let oldTypes: ParameterType[];
            let newTypes: ParameterType[];

            oldTypes = old.types!;
            newTypes = record.item.types!;
            
            let differ = createIterableDiffer((_: number, p: ParameterType) => {
                return p;
            });
            
            differ.diff(oldTypes);
            let changes = differ.diff(newTypes);

            if (changes !== null) {
                isDifferent = true;
            }
 
            if (isDifferent) {
                let changeRecord = new ParameterChangeRecord_(record.trackById, record.item.name!, record.item);

                this._parameterChangeRecord.push([changeRecord, old]);
            }
        });
        
        if (this._parameterChangeRecord.length === 0) {
            return null;
        }
        
        return this;
    }
    
    forEachNewParameter(cb: (record: ParameterChangeRecord)=>void): void {
        this._changes!.forEachNewIdentity(record => {
            cb(new ParameterChangeRecord_(record.trackById, record.item.name!, record.item));
        })
    }
    
    forEachDeletedParameter(cb: (record: ParameterChangeRecord)=>void): void {
        this._changes!.forEachDeletedIdentity(record => {
            cb(new ParameterChangeRecord_(record.trackById, record.item.name!, record.item));
        })
    }
    
    forEachChangedParameter(cb: (record: ParameterChangeRecord, old: IParameterDefinition|ParameterType[])=>void): void {
        this._parameterChangeRecord.forEach(([record, old]) => cb(record, old));
    }
}

class CommandDiffer_ implements CommandDiffer, CommandChanges {
    private _paramDiffer = createParameterDiffer();
    private _lastParamDiff: ParameterChanges|null = null;
    private _hasDescriptionChanged: boolean = false;
    private _lastCommand: ICommandDefinition|null = null;

    diff(cmd: ICommandDefinition): CommandChanges|null {
        if (!!this._lastCommand && cmd.name !== this._lastCommand.name) {
            throw new Error(`Cannot diff command with different names`);
        }
        
        this._reset();
        
        this._hasDescriptionChanged = (this._lastCommand ? this._lastCommand.shortDescription! : null) === cmd.shortDescription!;
        this._lastParamDiff = this._paramDiffer.diff(cmd.parameters || []);
        
        this._lastCommand = cmd;
        
        if (this._lastParamDiff === null && !this._hasDescriptionChanged) {
            return null;
        }

        return this;
    }
    
    hasDescriptionChanged(): boolean {
        return this._hasDescriptionChanged;
    }
    
    hasParametersChanged(): boolean {
        return this._lastParamDiff !== null;
    }
    
    forEachNewParameter(cb: (record: ParameterChangeRecord)=>void): void {
        if (!!this._lastParamDiff) {
            this._lastParamDiff.forEachNewParameter(cb);
        }
    }
    
    forEachChangedParameter(cb: (record: ParameterChangeRecord, old: IParameterDefinition|ParameterType[])=>void): void {
        if (!!this._lastParamDiff) {
            this._lastParamDiff.forEachChangedParameter(cb);
        }
    }
    
    forEachDeletedParameter(cb: (record: ParameterChangeRecord)=>void): void {
        if (!!this._lastParamDiff) {
            this._lastParamDiff.forEachDeletedParameter(cb);
        }
    }
    
    private _reset() {
        this._hasDescriptionChanged = false;
        this._lastParamDiff = null;
    }
}

export function createParameterDiffer(): ParameterDiffer {
    return new ParameterDiffer_();
}

export function createCommandDiffer(): CommandDiffer {
    return new CommandDiffer_();
}

function isParameterDefintion(v: IParameterDefinition|ParameterType[]): v is IParameterDefinition {
    return typeof v === 'object' && !Array.isArray(v);
}
