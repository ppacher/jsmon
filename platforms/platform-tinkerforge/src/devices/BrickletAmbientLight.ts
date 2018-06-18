import {Inject} from '@jsmon/core';
import {Device, Sensor, ParameterType} from '@jsmon/platform';
import {BrickletAmbientLight} from 'tinkerforge';
import {Observable} from 'rxjs/Observable';
import {register, Base, DeviceUID, TinkerforgeConnection} from './base';
import {map} from 'rxjs/operators';

@Device({
    description: 'Ambient light bricklet'
})
export class AmbientLight extends Base<BrickletAmbientLight>{
    @Sensor({
        name: 'illuminance',
        description: 'The current illuminance in Lux',
        type: ParameterType.NUMBER
    })
    illuminance: Observable<number>|null = null;
    
    constructor(@Inject(DeviceUID) uid: string, conn: TinkerforgeConnection) {
        super(BrickletAmbientLight, uid, conn);
    }
    
    setup() {
        this.illuminance = this.observeCallback<number>(BrickletAmbientLight.CALLBACK_ILLUMINANCE)
            .pipe(map(lx => lx/10))
        
        this.device.setIlluminanceCallbackPeriod(1000);
    }
}

register(BrickletAmbientLight, AmbientLight);