import {Device, Sensor, ParameterType} from '@jsmon/platform';
import {BrickletAmbientLight} from 'tinkerforge';
import {TinkerforgeService} from '../tinkerforge.service';
import {Subject} from 'rxjs/Subject';
import {register, Base} from './base';

@Device({
    description: 'Ambient light bricklet'
})
export class AmbientLight extends Base<BrickletAmbientLight>{
    @Sensor({
        name: 'illuminance',
        description: 'The current illuminance in Lux',
        type: ParameterType.NUMBER
    })
    readonly illuminance: Subject<number> = this.destroyable(new Subject());
    
    constructor(uid: string|number, conn: TinkerforgeService) {
        super(BrickletAmbientLight, uid, conn);
    }
    
    setup() {
        this._device.on(BrickletAmbientLight.CALLBACK_ILLUMINANCE, (lx: number) => {
            this.illuminance.next(lx/10);
        });
        
        this._device.setIlluminanceCallbackPeriod(1000);
    }
}

register(BrickletAmbientLight, AmbientLight);