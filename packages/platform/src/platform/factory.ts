import {Type, Provider} from '@homebot/core';

export interface SkillParameters {
    [key: string]: any;
}

export interface EnabledSkill {
    // The name of the skill class to load
    type: string;
    name?: string;
    // Description of the skill/device
    description?: string;
    // Parameters for the skill
    params: SkillParameters;
    plugin: string;
};

export interface SkillsSpec {
    plugin: string;
    path?: string;
    enable: EnabledSkill[];
};

export interface SkillSpecFile {
    version: string;
    plugins: SkillsSpec[];
}

export enum SkillType {
    Device,
    Service,
};

export interface Skill<T extends Type<any>> {
    token: T;
    providers: Provider[];
    type: SkillType;
}

export interface SkillFactory<T extends Type<any>> {
    create(params: SkillParameters): Skill<T>;
}

export interface SkillFactories {
    [key: string]: SkillFactory<any>;
}

