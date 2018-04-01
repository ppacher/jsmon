import {resolve, dirname} from 'path';
import {readFileSync, existsSync} from 'fs';

import {SkillFactory, SkillFactories, Skill, SkillParameters, SkillType, EnabledSkill} from './factory';
import {
    bootstrapPlugin,
    Type,
    Injector,
    Injectable
} from '@homebot/core';
import {DeviceManager, DeviceController} from '../devices';

export interface PluginModule {
    path: string;
    skills: SkillFactories;
    plugin: Type<any>;
};

export class SkillLoader {
    private _pluginCache: Map<string, PluginModule> = new Map();

    constructor(private _injector: Injector,
                private _deviceManager: DeviceManager,
                private _pluginDirs: string[]) {

        // Make sure we have absolute paths for all pluginDirs
        this._pluginDirs = this._pluginDirs.map(dir => resolve(dir));
    }
    
    async bootstrapSkill<T extends Type<any> = any>(plugin: string, config: EnabledSkill): Promise<DeviceController<T> | T> {
        let skill = await this.createSkill<T>(plugin, config.type, config.params);
        
        switch (skill.type) {
            case SkillType.Device: 
                return this._deviceManager.setupDevice(config.name || config.type, skill.token, config.description || '', skill.providers);
            case SkillType.Service:
                return this._injector.get(skill.token);
            default:
                throw new Error(`Unsupported skill type: ${skill.type} for skill ${config.type} (${config.name || config.type})`);
        }
    }
    
    async createSkill<T extends Type<any> = any>(plugin: string, skill: string, params: SkillParameters): Promise<Skill<T>> {
        let module = await this.loadModule(plugin);

        const factory = module.skills[skill];
        if (factory === undefined) {
            throw new Error(`Plugin ${plugin} does not provide skill ${skill}`);
        }
        
        let result = factory.create(params);
        
        return result;
    }
    
    async loadModule(name: string): Promise<PluginModule> {
        if (this._pluginCache.has(name)) {
            return this._pluginCache.get(name)!;
        }
        
        let config = await this.findModule(name);
        
        this._pluginCache.set(name, config);
        
        let desc = bootstrapPlugin(config.plugin);

        if (!!desc.providers) {
            this._injector.provide(desc.providers);
        }
        
        if (!!desc.bootstrapService) {
            desc.bootstrapService.forEach(svc => this._injector.get(svc));
        }

        return config;
    }
    
    async findModule(name: string): Promise<PluginModule> {
        let nodeModulePath = require.resolve(name);
        if (nodeModulePath) {
            nodeModulePath = dirname(nodeModulePath);
        }
        let paths = [
            ...this._pluginDirs.map(dir => resolve(dir, name)),
            // use NodeJS lookup strategy
            nodeModulePath,
        ];
    
        let config: PluginModule;

        let found = paths.some(p => {

            if (existsSync(p)) {
                let result = this._tryParsePackage(p);
                
                if (result === undefined) {
                    return false;
                }
                
                config = result;
                return true;
            }
            
            return false;
        });

        if (found) {
            return config!;
        } else {
            throw new Error(`Failed to find node module for ${name} in any of ${paths.join(", ")}`);
        }
    }
    
    _tryParsePackage(path: string): PluginModule|undefined {
        let packagePath = resolve(path, 'package.json');
        if (!existsSync(packagePath)) {
            console.log(`${path} does not contain a package.json file`);
            return undefined;
        }

        try {
            let data = readFileSync(packagePath);
            let content = JSON.parse(data.toString());
            if (content.homebot !== undefined) {
                let exports = require(path);
                let skills: SkillFactories = {};

                content.homebot.skills.forEach((skill: string) => skills[skill] = exports.skills[skill]);

                return {
                    path: path,
                    plugin: exports[content.homebot.plugin],
                    skills: skills,
                };
            }
        } catch(err) {
            console.error(`${path} cought error during parsing: `, err);
        }
        
        console.log(`${path}: failed to load module`);
        return undefined;
    }
}