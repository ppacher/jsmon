import {IterableDiffer, IterableChanges, IterableChangeRecord, createIterableDiffer} from '@homebot/core';
import {CommandSchema, ParameterDefinition, ParameterType} from '../devices';

export interface ParameterChangeRecord {
    trackById: string;
    name: string;
    item: ParameterDefinition|ParameterType[];
}

class ParameterChangeRecord_ implements ParameterChangeRecord {
    constructor(
        public readonly trackById: string,
        public readonly name: string,
        public readonly item: ParameterDefinition|ParameterType[],
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
    forEachChangedParameter(cb: (record: ParameterChangeRecord, old: ParameterDefinition|ParameterType[])=>void): void;
}

export interface CommandChanges extends ParameterChanges {
    /** Wether or not the command's parameters have changed */
    hasParametersChanged(): boolean;
    
    /** Wether or not the command's description has changed */
    hasDescriptionChanged(): boolean; 
}

export type Parameter = [string, ParameterDefinition|ParameterType[]];


/**
 * A {@link @homebot/core:TrackByFunction} from {@link CommandSchema}
 */
export function CommandTrackByFunction(idx: number, cmd: CommandSchema): string {
    return cmd.name;
}

export interface ParameterDiffer {
    diff(parameters: {[name: string]: ParameterDefinition|ParameterType[]}): ParameterChanges|null;
}

function ParameterTrackByFunction(idx: number, [name, defintion]: Parameter) {
    return name;
} 

class ParameterDiffer_ implements ParameterDiffer, ParameterChanges {
    private _iterableParameterDiffer = createIterableDiffer(ParameterTrackByFunction);
    private _changes: IterableChanges<Parameter>|null = null;

    diff(params: {[name: string]: ParameterDefinition|ParameterType[]}): ParameterChanges|null {
        let iterable = Object.keys(params).map(key => ([key, params[key]])) as Parameter[];
        
        this._changes = this._iterableParameterDiffer.diff(iterable);
        
        if (this._changes === null) {
            return null;
        }

        return this;
    }
    
    forEachNewParameter(cb: (record: ParameterChangeRecord)=>void): void {
        this._changes!.forEachNewIdentity(record => {
            cb(new ParameterChangeRecord_(record.trackById, record.item[0], record.item[1]));
        })
    }
    
    forEachDeletedParameter(cb: (record: ParameterChangeRecord)=>void): void {
        this._changes!.forEachDeletedIdentity(record => {
            cb(new ParameterChangeRecord_(record.trackById, record.item[0], record.item[1]));
        })
    }
    
    forEachChangedParameter(cb: (record: ParameterChangeRecord, old: ParameterDefinition|ParameterType[])=>void): void {
        // since we are mapping all object keys to {@link Parameter} we 
        // will get all parameters as "changed"
        this._changes!.forEachIdentityChanged((record, old) => {
            let isDifferent = false;
            
            let newIsDefinition = isParameterDefintion(record.item[1]);
            let oldIsDefinition = isParameterDefintion(old[1]);
            
            // Check if the type of definition has changed (i.e. ParameterDefintion vs ParameterType[])
            if (newIsDefinition !== oldIsDefinition) {
                isDifferent = true;
            }
            
            if (!isDifferent) {
                let oldTypes: ParameterType[];
                let newTypes: ParameterType[];

                if (newIsDefinition && oldIsDefinition) {
                    oldTypes = (old[1] as ParameterDefinition).types;
                    newTypes = (record.item[1] as ParameterDefinition).types;
                } else {
                    oldTypes = old[1] as ParameterType[];
                    newTypes = record.item[1] as ParameterType[];
                }
                
                let differ = createIterableDiffer((_: number, p: ParameterType) => {
                    return p;
                });
                
                differ.diff(oldTypes);
                let changes = differ.diff(newTypes);

                if (changes !== null) {
                    isDifferent = true;
                }
            }
            
            if (isDifferent) {
                let changeRecord = new ParameterChangeRecord_(record.trackById, record.item[0], record.item[1]);

                cb(changeRecord, old[1]);
            }
        });
    }
}

export function createParameterDiffer(): ParameterDiffer {
    return new ParameterDiffer_();
}

function isParameterDefintion(v: ParameterDefinition|ParameterType[]): v is ParameterDefinition {
    return typeof v === 'object' && !Array.isArray(v);
}
