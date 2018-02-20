import {Injectable, ReflectiveInjector} from '@homebot/core';
import {DeviceManager} from '../../device-manager';

@Injectable()
export class HistoryService {
    constructor(//private _injector: ReflectiveInjector,
                private _device: DeviceManager) {

        //const device = this._injector.get(DeviceManager);
        //console.log('[history]: injector = ' + this._injector.toString());
    }
}