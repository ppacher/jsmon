import {IterableDiffer, IterableChangeRecord, IterableChanges, createIterableDiffer} from '@jsmon/core';
import {ISensorSchema} from '../devices';

export interface SensorChanges {
    /** Wether or not the sensor description has changed */
    hasDescriptionChanged(): boolean;

    /** Wether or not the sensor type has changed */
    hasTypeChanged(): boolean;
    
    /** Returns the new sensor schema */
    getSchema(): ISensorSchema;
}

class SensorChanges_ implements SensorChanges {
    constructor(
        private _hasDescriptionChanged: boolean,
        private _hasTypeChanged: boolean,
        private _schema: ISensorSchema,
    ) {}

    hasDescriptionChanged(): boolean {
        return this._hasDescriptionChanged;
    }
    
    hasChanged(): boolean {
        return this.hasDescriptionChanged();
    }
    
    hasTypeChanged(): boolean {
        return this._hasTypeChanged;
    }

    getSchema(): ISensorSchema {
        return this._schema;
    }
}

/**
 * Calculates differences between two {@link ISensorSchema}s
 * 
 * Note that the name of the sensor schemas is not allowed to change and
 * must be the same (Otherwise you are probably comparing two independed sensor schemas)
 * 
 * @param oldSensor The old sensor schema
 * @param newSensor The new sensor schema
 */
export function getSensorDiff(oldSensor: ISensorSchema, newSensor: ISensorSchema): SensorChanges|null {
    // the name of the sensor is not allowed to change
    if (oldSensor.name !== newSensor.name) {
        throw new Error(`Cannot diff sensors with different names`);
    }
    
    let descriptionChanged = oldSensor.description !== newSensor.description;
    let typeChanged = oldSensor.type !== newSensor.type;
    
    if (descriptionChanged || typeChanged) {
        return new SensorChanges_(descriptionChanged, typeChanged, newSensor);
    }
    
    return null;
}

/**
 * a {@link @jsmon/core:TrackByFunction} for {@link ISensorSchema}
 */
export function SensorTrackByFunction(idx: number, sensor: ISensorSchema): any {
    return sensor.name;
}

/**
 * Contains changes between two sets of {@link ISensorSchema}s
 */
export interface IterableSensorChanges {
    /**
     * Invokes the provided callback function for each new sensor
     */
    forEachNewSensor(cb: (record: IterableChangeRecord<SensorChanges>)=>void): void;
    
    /**
     * Invokes the provided callback function for each deleted sensor
     */
    forEachDeletedSensor(cb: (record: IterableChangeRecord<SensorChanges>)=>void): void;
    
    /**
     * Invokes the provided callback function for each changed/updated sensor
     */
    forEachChangedSensor(cb: (record: IterableChangeRecord<SensorChanges>)=>void): void;
}

/**
 * Tracks changes between sets of {@link ISensorSchema}s
 */
export interface IterableSensorDiffer {
    /**
     * Searches for differences witihn the ISensorSchema iterable.
     * Returns null if no changes occured
     */
    diff(sensors: Iterable<ISensorSchema>|ISensorSchema[]): IterableSensorChanges|null;
}

class IterableSensorChangeRecord implements IterableChangeRecord<SensorChanges> {
    constructor(
        public readonly trackById: any,
        public readonly item: SensorChanges
    ) {}
}

class IterableSensorDiffer_ implements IterableSensorChanges, IterableSensorDiffer {
    /** our internal iterable differ for tracking changes */
    private _iterableDiffer = createIterableDiffer(SensorTrackByFunction);
    private _changes: IterableChanges<ISensorSchema>|null = null;

    diff(sensors: Iterable<ISensorSchema>|ISensorSchema[]): IterableSensorChanges|null {
        this._changes = this._iterableDiffer.diff(sensors);
        
        if (this._changes === null) {
            return null;
        }
        
        return this;
    }
    
    forEachNewSensor(cb: (record: IterableChangeRecord<SensorChanges>)=>void): void {
        this._changes!.forEachNewIdentity(schema => {
            let diff = new SensorChanges_(false, false, schema.item);
            let record = new IterableSensorChangeRecord(schema.trackById, diff);
            
            cb(record);
        });
    }
    
    forEachDeletedSensor(cb: (record: IterableChangeRecord<SensorChanges>)=>void): void {
        this._changes!.forEachDeletedIdentity(schema => {
            let diff = new SensorChanges_(false, false, schema.item);
            let record = new IterableSensorChangeRecord(schema.trackById, diff);
            
            cb(record);
        });
    }
    
    forEachChangedSensor(cb: (record: IterableChangeRecord<SensorChanges>)=>void): void {
        this._changes!.forEachIdentityChanged((schema, oldSensor) => {
            let diff = getSensorDiff(oldSensor, schema.item);
            if (!!diff) {
                let record = new IterableSensorChangeRecord(schema.trackById, diff);
                cb(record);
            }
        });
    }
}

/**
 * Creates a new {@link IterableSensorDiffer} that can be used to track
 * changes to a list of {@link ISensorSchema}s
 */
export function createIterableSensorDiffer(): IterableSensorDiffer {
    return new IterableSensorDiffer_();
}