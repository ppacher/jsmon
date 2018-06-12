import {OnDestroy} from '@jsmon/core';
import {Device, Sensor, ParameterType} from '@jsmon/platform';
import * as sysinfo from 'systeminformation';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {fromPromise} from 'rxjs/observable/fromPromise';
import {interval} from 'rxjs/observable/interval';
import {of} from 'rxjs/observable/of';

import {flatMap, share, catchError, filter, takeUntil} from 'rxjs/operators';

import {Systeminformation} from 'systeminformation';

function poll<T>(until: Observable<any>, p: () => Promise<T>): Observable<T> {
    return interval(10000)
            .pipe(
                takeUntil(until),
                flatMap(
                    () => fromPromise(p())
                            .pipe(
                                catchError(err => of(new Error(err))),
                                filter(s => !(s instanceof Error)),
                            )
                ),
                share()
            ) as any as Observable<T>;
}

@Device({
    description: 'System information',
})
export class SysInfoDevice {
    private readonly _destroyed: Subject<void> = new Subject();
    
    @Sensor({name: 'memory', type: ParameterType.OBJECT})
    readonly memory = poll<Systeminformation.MemData>(this._destroyed, sysinfo.mem);
    
    @Sensor({name: 'cpu', type: ParameterType.OBJECT})
    readonly cpu = poll<Systeminformation.CpuData>(this._destroyed, sysinfo.cpu);
    
    @Sensor({name: 'battery', type: ParameterType.OBJECT})
    readonly battery = poll<Systeminformation.BatteryData>(this._destroyed, sysinfo.battery);
    
    @Sensor({name: 'load', type: ParameterType.OBJECT})
    readonly load = poll<Systeminformation.CurrentLoadData>(this._destroyed, sysinfo.currentLoad);
    
    @Sensor({name: 'fs', type: ParameterType.OBJECT})
    readonly fs = poll<Systeminformation.FsSizeData[]>(this._destroyed, sysinfo.fsSize);
    
    onDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    }
}
