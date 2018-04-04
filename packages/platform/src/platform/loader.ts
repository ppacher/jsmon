import {resolve, dirname} from 'path';
import {readFileSync, existsSync} from 'fs';

import {isPromiseLike} from '@homebot/core/utils';
import {isExtenableError} from '@homebot/core/error';
import {Logger} from '../log';

import {
    DeviceSpec,
    HomeBotPlatformExtension,
    PlatformFactories,
    PlatformFactory,
    PlatformParameters,
    PlatformSpec,
    ServiceSpec
} from './factory';

import {
    bootstrapPlugin,
    Type,
    Injector,
    Injectable
} from '@homebot/core';
import {DeviceManager, DeviceController} from '../devices';

import * as errors from './errors';

/**
 * @docs-internal
 */
export interface PluginModule {
    path: string;
    factories: PlatformFactories,
};

/**
 * Configuration options for bootstrapping a platform
 */
export interface BootstrapOptions {
    /**
     * Whether or not the {@link PlatformLoader} should try native NodeJS
     * module resolution
     */
    disableNodeModules?: boolean;
}

export class PlatformLoader {
    private _platformModuleCache: Map<string, PluginModule> = new Map();
    private _pluginCache: Map<string, any> = new Map();

    constructor(private _injector: Injector,
                private _deviceManager: DeviceManager,
                private _pluginDirs: string[],
                private _logger?: Logger) {

        // Make sure we have absolute paths for all pluginDirs
        this._pluginDirs = this._pluginDirs.map(dir => resolve(dir));
    }
    
    async bootstrap<T extends Type<any> = any>(platformName: string, featureName: string, parameters: PlatformParameters): Promise<any[]> {
        let spec = await this.loadPlatformFeature<T>(platformName, featureName, parameters);
        
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
    
    async loadPlatformFeature<T extends Type<any> = any>(platformName: string, featureName: string, params: PlatformParameters): Promise<PlatformSpec> {
        let module = await this.cacheOrLoadModule(platformName);

        const factory = module.factories[featureName];
        if (factory === undefined) {
            throw new Error(`Plugin ${platformName} does not provide skill ${featureName}`);
        }

        let promiseOrSpec = factory(params);
        
        if (isPromiseLike<PlatformSpec>(promiseOrSpec)) {
            return await promiseOrSpec;
        }
        
        return promiseOrSpec;
    }
    
    /**
     * Try to find and load the NodeJS module that provides a given platfrom.
     * If the platfrom has already been loaded it is returned from the cache
     * 
     * @param name The name of the platform or plugin
     * @param disableNodeModule Whether or not native NodeJS module resolution should be used
     */
    async cacheOrLoadModule(name: string, disableNodeModule: boolean = false): Promise<PluginModule> {
        if (this._platformModuleCache.has(name)) {
            return this._platformModuleCache.get(name)!;
        }
        
        try {
            let entryPoint = await this._findModuleEntryPoint(name, disableNodeModule);
            let config = this._tryLoadModule(entryPoint);
            
            this._platformModuleCache.set(name, config);

            return config;
        } catch (err) {
            if (isExtenableError(err)) {
                err.addField('platform', name);
            }
            
            throw err;
        }
    }

    /**
     * Bootstrap a Plugin class by adding exported providers to the injector
     * and creating an instance for each `bootstrapService` as well as the plugin
     * class itself
     * 
     * @param platformName The name of the platform
     * @param plugin The plugin class to bootstrap (ie. decorated by @Plugin())
     */
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
    
    /**
     * Searches for a plugin or platform module with the given name within all
     * plugin directories. 
     *
     * If the optional parameter `disableNodeModule` is set to true, native NodeJS module
     * resolution won't be used.
     * 
     * @param name The name of the platfrom or plugin to search
     */
    async _findModuleEntryPoint(name: string, disableNodeModules: boolean = false): Promise<string> {
        let nodeModulePath = null;
        
        if (!disableNodeModules) {
            try {
                nodeModulePath = require.resolve(name);
                nodeModulePath = dirname(nodeModulePath);
            } catch(err) {}
        }

        let paths = [
            ...this._pluginDirs.map(dir => resolve(dir, name)),
            // use NodeJS lookup strategy
            ...(nodeModulePath && !disableNodeModules ? [nodeModulePath] : [])
        ];
    
        let errs: Error[] = [];
        let entryFile: string|undefined = undefined;

        paths.some(p => {
            if (existsSync(p)) {
                try {
                    entryFile = this._getEntryFile(p);
                    
                    return true;
                } catch (err) {
                    errs.push(err);
                }
            }
            
            return false;
        });

        if (entryFile !== undefined) {
            return entryFile;
        }
        
        throw errors.getPluginNotFoundError(name, errs);
    }
    
    /**
     * Try to load the given platform entry file. Refer to {@link PlatformSpec} for
     * more information about the entry file
     * 
     * @param entryFile The path to the entry file of the platform
     */
    _tryLoadModule(entryFile: string): PluginModule {
        if (!existsSync(entryFile)) {
            throw errors.getEntryPointFileNotFoundError(entryFile);
        }
        
        let exports: any;
        
        try {
            exports = require(entryFile);
        } catch (err) {
            throw errors.getCannotLoadEntryFileError(entryFile, err);
        }
        
        if (!exports.hasOwnProperty('homebot')) {
            throw errors.getMissingHomebotExportError(entryFile);
        }
        
        return {
            path: entryFile,
            factories: exports.homebot,
        };
    }
    
    /**
     * Tries to get the entry-file path of the platform from the given NodeJS module
     * 
     * @param path The path of the NodeJS module
     */
    _getEntryFile(path: string): string {
        let packagePath = resolve(path, 'package.json');
        if (!existsSync(packagePath)) {
            throw errors.getInvalidPackageError(path, 'No package.json file found');
        }
        
        let entryFile: string|undefined = undefined;

        try {
            let data = readFileSync(packagePath);
            let content = JSON.parse(data.toString()) as HomeBotPlatformExtension;
            if (content.homebot !== undefined) {
                entryFile = resolve(path, (content.homebot.entry || content.main));
            }
        } catch(err) {
            throw errors.getInvalidPackageError(path, err);
        }
        
        if (entryFile === undefined) {
            throw errors.getInvalidPackageError(path, 'no "homebot" configuration property found');
        }
        
        return entryFile;
    }
}