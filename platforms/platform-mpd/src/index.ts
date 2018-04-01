import { SkillFactories, SkillParameters, Skill, SkillType, DeviceController} from '@homebot/platform';
import { MPDDevice } from './mpd.device';
import { MPDConfig } from './config';

export * from './mpd.plugin';
export * from './mpd.service';
export * from './config';
export * from './mpd.device';

export const skills: SkillFactories = {
    'MPD': {
        create(params: SkillParameters): Skill<typeof MPDDevice> {
            let {
                address,
                port,
                username,
                password
            } = params;

            return {
                token: MPDDevice,
                providers: [
                    MPDConfig.provide(
                        new MPDConfig(address, port, username, password)
                    )
                ],
                type: SkillType.Device,
            };
        }
    }
}