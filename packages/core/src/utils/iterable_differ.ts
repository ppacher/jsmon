import {iterableForEach} from '../utils';

/**
 * TrackByFunction is used track changes to interables
 * it should return unique and constant IDs for iterable entries
 */
export interface TrackByFunction<T> {
    (index: number, obj: T): any;
}

export interface IterableChangeRecord<T> {
    item: T;
    trackById: any;
}

export interface IterableChanges<T> {
    forEachIdentityChanged(cb: (record: IterableChangeRecord<T>) => void): void;
    forEachNewIdentity(cb: (record: IterableChangeRecord<T>) => void): void;
    forEachDeletedIdentity(cb: (record: IterableChangeRecord<T>) => void): void;
    forEachRecord(cb: (record: IterableChangeRecord<T>, index: number) => void): void;
}

export interface IterableDiffer<T> {
    diff(iter: Iterable<T>|Array<T>): IterableChanges<T>|null;
}

/** Default {@link TrackByFunction} */
const trackByIdentity = (idx: number, b: any) => b

class IterableChangeRecord_<T> implements IterableChangeRecord<T> {
    constructor(public readonly item: T,
                public readonly trackById: any) {}
}

class IterableDiffer_<T> implements IterableDiffer<T>, IterableChanges<T>{
    private _records: IterableChangeRecord_<T>[] = [];
    private _new: IterableChangeRecord_<T>[] = [];
    private _deleted: IterableChangeRecord_<T>[] = [];
    private _changed: IterableChangeRecord_<T>[] = [];
    
    constructor(private _trackByFn: TrackByFunction<T> = trackByIdentity) {}

    diff(iter: Iterable<T>|Array<T>): IterableChanges<T>|null {
        this._reset();
        let _records: IterableChangeRecord_<T>[] = [];
        
        iterableForEach(iter, (item, index) => {
            let trackById = this._trackByFn(index, item);
            let newRecord = new IterableChangeRecord_(item, trackById);

            // find the ID of the previous record
            let prevIdx = this._records.findIndex(record => looseIdentical(record.trackById, newRecord.trackById));
            
            if (prevIdx === -1) {
                // This is a new record
                this._new.push(newRecord);
            } else {
                let prevRecord = this._records[prevIdx];

                if (!looseIdentical(prevRecord.item, newRecord.item)) {
                    // identity has changed
                    this._changed.push(newRecord);
                }
                
                this._records.splice(prevIdx, 1);
            }
            
            _records.push(newRecord);
        });
        
        // every record still available in this._records has been deleted
        this._records.forEach(record => {
            this._deleted.push(record);
        });
        
        // update the set of all records
        this._records = _records;
        
        if (this._new.length === 0 && this._changed.length === 0 && this._deleted.length === 0) {
            return null;
        }
        
        return this;
    }
    
    forEachDeletedIdentity(cb: (record: IterableChangeRecord<T>)=>void) {
        this._deleted.forEach(record => cb(record));
    }
    
    forEachIdentityChanged(cb: (record: IterableChangeRecord<T>)=>void) {
        this._changed.forEach(record => cb(record));
    }
    
    forEachNewIdentity(cb: (record: IterableChangeRecord<T>)=>void) {
        this._new.forEach(record => cb(record));
    }

    forEachRecord(cb: (record: IterableChangeRecord<T>, index: number) => void) {
        this._records.forEach((record, idx) => cb(record, idx));
    }
    
    private _reset() {
        this._new = [];
        this._deleted = [];
        this._changed = [];
    }
}

export function createIterableDiffer<T>(trackBy?: TrackByFunction<T>): IterableDiffer<T> {
    return new IterableDiffer_(trackBy);
}

function looseIdentical<T>(a: T, b: T): boolean {
    if (a === b) {
        return true;
    }
    
    if (a.valueOf() === b.valueOf()) {
        return true;
    }
    
    if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) {
        return true;
    }
    
    return false;
}

