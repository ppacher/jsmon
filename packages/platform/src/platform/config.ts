import {PlatformParameters} from './factory';
import {resolve} from 'path';
import {readFileSync} from 'fs';
import {safeLoad} from 'js-yaml';


export interface EnabledSkill {
    // The name of the skill class to load
    type: string;
    
    name?: string;
    // Description of the skill/device
    description?: string;
    // Parameters for the skill
    params: PlatformParameters;
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

export enum SkillSpecFileVersion {
    V1_Alpha = 'v1-alpha'
}

export function loadSkillConfig(path: string): SkillsSpec[] {
    let filePath = resolve(path);
    
    let bytes = readFileSync(filePath);
    
    let content;

    if (path.endsWith('.json')) {
        content = JSON.parse(bytes.toString());
    } else
    if (path.endsWith('.yaml') || path.endsWith('.yml')) {
        content = safeLoad(bytes.toString());
    }

    if (!content.version) {
        throw new Error(`Invalid Skill file, missing version property`);
    }
    
    if (content.version !== SkillSpecFileVersion.V1_Alpha) {
        throw new Error(`Invalid Skill file: unknown version ${content.version}`);
    }
    
    if (!content.plugins) {
        throw new Error(`Invalid skill file: missing plugin section`);
    }
    
    (content.plugins as SkillsSpec[]).forEach(spec => {
        if (!spec.enable || !spec.plugin) {
            throw new Error(`Invalid plugin configuration`);
        }
    });
    
    return content.plugins;
}