import {Device, Sensor, ParameterType} from '@jsmon/platform';
import {BrickletMotionDetector} from 'tinkerforge';
import {TinkerforgeService} from '../tinkerforge.service';
import {Subject} from 'rxjs/Subject';
import {Base} from './base';

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
    
    private _hasMotion: boolean = false;

    constructor(uid: string|number, conn: TinkerforgeService) {
        super(BrickletMotionDetector, uid, conn);
    }
    
    setup() {
        this._device.on(BrickletMotionDetector.CALLBACK_MOTION_DETECTED, () => {
            this.motionDetected.next(true);
            this._hasMotion = true;
        });
        
        this._device.on(BrickletMotionDetector.CALLBACK_DETECTION_CYCLE_ENDED, () => {
            if (!this._hasMotion) {
                this.motionDetected.next(false);
            } else {
                this._hasMotion = false;
            }
        });
    }
}

