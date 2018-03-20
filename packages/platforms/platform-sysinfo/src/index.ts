import {Plugin, SkillFactories, SkillParameters, Skill, SkillType} from '@homebot/core';
import { SysInfoDevice } from './sysinfo.device';
export * from './sysinfo.device';

@Plugin({
})
export class SysInfoPlugin {}


export const skills: SkillFactories = {
    'Sysinfo': {
        create(params: SkillParameters): Skill<typeof SysInfoDevice> {
            return {
                token: SysInfoDevice,
                providers: [],
                type: SkillType.Device,
            }
        }
    }
}