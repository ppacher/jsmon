export * from './firetv.plugin';
export * from './firetv';
export * from './keycodes';
export * from './states';
export * from './apps';
export * from './firetv.device';

import {SkillFactories, SkillParameters, Skill, SkillType} from '@homebot/core';
import { FireTVDevice, FireTVConfig } from './firetv.device';

export const skills: SkillFactories = {
    'FireTV': {
        create(params: SkillParameters): Skill<any> {
            if (!params['host']) {
                throw new Error(`Missing hostname for FireTV`);
            }
            return {
                providers: [
                    FireTVConfig.provide(new FireTVConfig(params['host'])),
                ],
                token: FireTVDevice,
                type: SkillType.Device
            };
        }
    }
}