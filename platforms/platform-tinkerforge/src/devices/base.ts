import {Type, OnDestroy} from '@jsmon/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {takeUntil, share} from 'rxjs/operators';

import * as tf from 'tinkerforge';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export const DeviceUID = 'DeviceUID';

export abstract class TinkerforgeConnection {
    abstract getConnection(): Promise<tf.IPConnection>;
    abstract watchDeviceState(uid: string): Observable<boolean>;
}

export abstract class Base<T extends tf.All> implements OnDestroy {
    protected _device: T|null = null;
    protected _destroyed: Subject<void> = new Subject();
    protected _connected: Observable<boolean>;
    
    protected get device(): T {
        if (!this._device) {
            throw new Error(`Not yet connected`);
        }
        
        return this._device!;
    }

    constructor(cls: Type<T>,
                protected uid: string,
                protected conn: TinkerforgeConnection) {
                
        this._connected = this.conn.watchDeviceState(uid);
        
        // Wait for the next VM turn before we try to get a connection
        setTimeout(() => {
            conn.getConnection()
                .then(c => {
                    this._device = new cls(uid, c);
                    this.setup();
                });
        }, 1);
    }
    
    onDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    }
    
    protected destroyable<T extends Subject<any>|Observable<any>>(val: T): T {
        if (val instanceof Subject) {
            this._destroyed.subscribe(() => val.complete());
            return val;
        }
        
        return val.pipe(takeUntil(this._destroyed)) as T;
    }
    
    protected observeCallback<T>(callbackId: number, ...args: any[]): Observable<T> {
        return new Observable(observer => {
        
            this._device!.on(callbackId, (...res: any[]) => {
                observer.next(res as any as T);
            });
            
            return () => {};
        }).pipe(takeUntil(this._destroyed), share()) as Observable<T>;
    }
    
    protected abstract setup(): void;
}

const _devices: Map<number, Type<Base<any>>> = new Map();

export function register(type: {DEVICE_IDENTIFIER: number}, d: Type<Base<any>>) {
    _devices.set(type.DEVICE_IDENTIFIER, d);
}

export function getClass(type: number): Type<Base<any>>|undefined {
    return _devices.get(type);
}