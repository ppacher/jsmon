import {Inject} from '@jsmon/core';
import {Device, Sensor, ParameterType} from '@jsmon/platform';
import {BrickletMotionDetector} from 'tinkerforge';
import {Subject} from 'rxjs/Subject';
import {register, Base, DeviceUID, TinkerforgeConnection} from './base';

@Device({
    description: 'Motion detector bricklet'
})
export class MotionDetector extends Base<BrickletMotionDetector>{
    @Sensor({
        name: 'motion_detected',
        description: 'Wether or not motion has been detected within the last detection cycle',
        type: ParameterType.BOOLEAN
    })
    readonly motionDetected: Subject<boolean> = this.destroyable(new Subject());
    
    constructor(@Inject(DeviceUID) uid: string, conn: TinkerforgeConnection) {
        super(BrickletMotionDetector, uid, conn);
    }
    
    setup() {
        this.device.on(BrickletMotionDetector.CALLBACK_MOTION_DETECTED, () => {
            this.motionDetected.next(true);
        });
        
        this.device.on(BrickletMotionDetector.CALLBACK_DETECTION_CYCLE_ENDED, () => {
            this.motionDetected.next(false);
        });
    }
}

register(BrickletMotionDetector, MotionDetector);