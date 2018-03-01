import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

import {filter, takeUntil, pairwise} from 'rxjs/operators';

export interface ConditionFn<T> {
    (a: T, b?: T): boolean;
}

export class Trigger<T> {
    private _dipose: Subject<void> = new Subject();
    
    constructor(
        public readonly sensor: Observable<T>,
        public readonly condition: ConditionFn<T>,
        public readonly cb: (val: T) => void,
    ) {
        this.sensor
            .pipe(
                takeUntil(this._dipose),
                pairwise(),
                filter(([last, current]: [T, T]) => this.condition(current, last))
            )
            .subscribe(value => this.cb(value[1]));
    }
    
    dispose(): void {
        this._dipose.next();
        this._dipose.complete();
    }
}

