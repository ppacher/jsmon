import {Type, OnDestroy} from '@jsmon/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {takeUntil} from 'rxjs/operators';
import {TinkerforgeService} from '../tinkerforge.service';

import * as tf from 'tinkerforge';

export abstract class Base<T extends tf.All> implements OnDestroy {
    protected _device: T;
    protected _destroyed: Subject<void> = new Subject();

    constructor(cls: Type<T>,
                protected uid: string|number,
                protected conn: TinkerforgeService) {
                
        conn.getConnection()
            .then(conn => {
                this._device = new cls(uid, conn);
                this.setup();
            })
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
    
    abstract setup(): void;
}