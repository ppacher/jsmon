import {resolve, dirname} from 'path';
import {readFileSync, existsSync} from 'fs';

import {isPromiseLike} from '@homebot/core/utils';

import {
    DeviceSpec,
    HomeBotPlatformExtension,
    PlatformFactories,
    PlatformFactory,
    PlatformParameters,
    PlatformSpec,
    ServiceSpec
} from './factory';
import {EnabledSkill} from './config';

import {
    bootstrapPlugin,
    Type,
    Injector,
    Injectable
} from '@homebot/core';
import {DeviceManager, DeviceController} from '../devices';

export interface PluginModule {
    path: string;
    factories: PlatformFactories,
};

export class PlatformLoader {
    private _platformModuleCache: Map<string, PluginModule> = new Map();
    private _pluginCache: Map<string, any> = new Map();

    constructor(private _injector: Injector,
                private _deviceManager: DeviceManager,
                private _pluginDirs: string[]) {

        // Make sure we have absolute paths for all pluginDirs
        this._pluginDirs = this._pluginDirs.map(dir => resolve(dir));
    }
    
    async bootstrap<T extends Type<any> = any>(platformName: string, featureName: string, parameters: PlatformParameters): Promise<any[]> {
        let spec = await this.createPlatform<T>(platformName, featureName, parameters);
        
        let result: any[] = [];
        
        (spec.devices || []).forEach(dev => {
            let instance = this._deviceManager.setupDevice(dev.name, dev.class, dev.description || '', dev.providers || []);
            
            result.push(instance);
        });
        
        (spec.services || []).forEach(svc => {
            let childInjector = new Injector(this._injector);
            childInjector.provide(svc.class);
            childInjector.provide(svc.providers || []);
            
            let instance = childInjector.get(svc.class);
            result.push(instance);
        });
        
        return result;
    }
    
    async createPlatform<T extends Type<any> = any>(platformName: string, featureName: string, params: PlatformParameters): Promise<PlatformSpec> {
        let module = await this.loadModule(platformName);

        const factory = module.factories[featureName];
        if (factory === undefined) {
            throw new Error(`Plugin ${platformName} does not provide skill ${featureName}`);
        }

        let promiseOrSpec = factory(params);
        
        if (isPromiseLike(promiseOrSpec)) {
            return await (promiseOrSpec as Promise<PlatformSpec>);
        }
        
        return (promiseOrSpec as PlatformSpec);
    }
    
    async loadModule(name: string): Promise<PluginModule> {
        if (this._platformModuleCache.has(name)) {
            return this._platformModuleCache.get(name)!;
        }
        
        let config = await this._findModule(name);
        
        this._platformModuleCache.set(name, config);

        return config;
    }

    async bootstrapPlugin(platformName: string, plugin: Type<any>) {
        let pluginKey = `${platformName}-${plugin.name}`;
        if (this._pluginCache.has(pluginKey)) {
            return;
        }
        
        let desc = bootstrapPlugin(plugin);
        console.log(desc);

        if (!!desc.providers) {
            this._injector.provide(desc.providers);
        }
        
        if (!!desc.bootstrapService) {
            desc.bootstrapService.forEach(svc => this._injector.get(svc));
        }
        
        this._injector.provide(plugin);
        let instance = this._injector.get(plugin);
        
        this._pluginCache.set(pluginKey, instance);
    }
    
    async _findModule(name: string): Promise<PluginModule> {
        let nodeModulePath = null;
        
        try {
            nodeModulePath = require.resolve(name);
            nodeModulePath = dirname(nodeModulePath);
        } catch(err) {}

        let paths = [
            ...this._pluginDirs.map(dir => resolve(dir, name)),
            // use NodeJS lookup strategy
            ...(nodeModulePath ? [nodeModulePath] : [])
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
            let content = JSON.parse(data.toString()) as HomeBotPlatformExtension;
            if (content.homebot !== undefined) {
                let entryFile = resolve(path, (content.homebot.entry || content.main));
                let exports = require(entryFile);
                if (exports.homebot === undefined) {
                    return undefined;
                }
                
                let factories = exports.homebot;
                
                return {
                    path: path,
                    factories: factories,
                };
            }
        } catch(err) {
            console.error(`${path} cought error during parsing: `, err);
        }
        
        console.log(`${path}: failed to load module`);
        return undefined;
    }
}