import {Device, Sensor, ParameterType} from '@homebot/core';
import * as sysinfo from 'systeminformation';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {fromPromise} from 'rxjs/observable/fromPromise';
import {interval} from 'rxjs/observable/interval';
import {share} from 'rxjs/operator/share';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/do';

import {Systeminformation} from 'systeminformation';

function poll<T>(p: () => Promise<T>): Observable<T> {
    return share.apply(
        interval(5000)
            .flatMap(() => fromPromise(p()))
    );
}

@Device({
    description: 'System information',
})
export class SysInfoDevice {
    @Sensor({name: 'memory', type: ParameterType.Object})
    readonly memory = poll<Systeminformation.MemData>(sysinfo.mem);
    
    @Sensor({name: 'cpu', type: ParameterType.Object})
    readonly cpu = poll<Systeminformation.CpuData>(sysinfo.cpu);
    
    @Sensor({name: 'battery', type: ParameterType.Object})
    readonly battery = poll<Systeminformation.BatteryData>(sysinfo.battery);
    
    @Sensor({name: 'load', type: ParameterType.Object})
    readonly load = poll<Systeminformation.CurrentLoadData>(sysinfo.currentLoad);
    
    @Sensor({name: 'fs', type: ParameterType.Object})
    readonly fs = poll<Systeminformation.FsSizeData[]>(sysinfo.fsSize);
}
