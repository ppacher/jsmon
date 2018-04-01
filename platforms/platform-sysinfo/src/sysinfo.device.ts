import {Device, Sensor, ParameterType} from '@homebot/platform';
import * as sysinfo from 'systeminformation';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {fromPromise} from 'rxjs/observable/fromPromise';
import {interval} from 'rxjs/observable/interval';
import {of} from 'rxjs/observable/of';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/share';

import {Systeminformation} from 'systeminformation';

function poll<T>(p: () => Promise<T>): Observable<T> {
    return interval(10000)
            .flatMap(
                () => fromPromise(p())
                        .catch(err => of(new Error(err)))
                        .filter(s => !(s instanceof Error)) as Observable<T>
            ).share();
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
