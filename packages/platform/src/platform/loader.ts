import {resolve, dirname} from 'path';
import {readFileSync, existsSync} from 'fs';

import {isPromiseLike, stringify} from '@homebot/core/utils';
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
    Injectable,
    Provider,
    normalizeProvider
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
    private _pluginCache: Map<string, Injector> = new Map();
    private _log: Logger;

    constructor(private _injector: Injector,
                private _deviceManager: DeviceManager,
                private _pluginDirs: string[],
                logger?: Logger) {
                
        if (!!logger) {
            this._log = logger.createChild('loader');
        } else {
            this._log = new Logger(undefined, 'loader');
        }

        // Make sure we have absolute paths for all pluginDirs
        this._pluginDirs = this._pluginDirs.map(dir => resolve(dir));
    }
    
    async bootstrap(platformName: string, featureName: string, parameters: PlatformParameters, options?: BootstrapOptions): Promise<any[]> {
        if (options === undefined || options === null) {
            options = {
                disableNodeModules: false,
            };
        }
        
        let module = await this.cacheOrLoadModule(platformName, options.disableNodeModules);
        
        return await this.createFeature(module, featureName, parameters);
    }
    
    async bootstrapFile(path: string, featureName: string, parameters: PlatformParameters): Promise<any[]> {
        let module = this._tryLoadModule(path);
        
        return await this.createFeature(module, featureName, parameters);
    }
    
    
    async createFeature(module: PluginModule, featureName: string, params: PlatformParameters): Promise<any[]> {
        const factory = module.factories[featureName];
        if (factory === undefined) {
            throw new Error(`Plugin does not provide skill ${featureName}`);
        }

        const promiseOrSpec = factory(params);
        
        let spec: PlatformSpec;
        if (isPromiseLike<PlatformSpec>(promiseOrSpec)) {
            spec = await promiseOrSpec;
        } else {
            spec = promiseOrSpec;
        }
        
        const result: any[] = [];
        
        let injector = this._injector;
        if (!!spec.plugin) {
            injector = await this.bootstrapPlugin(module.path, spec.plugin);
        }
        
        (spec.devices || []).forEach(dev => {
            this._log.debug(`creating device for ${dev.name} using ${stringify(dev.class)}`)
            let instance = this._deviceManager.setupDevice(dev.name, dev.class, dev.description || '', dev.providers || []);
            
            result.push(instance);
        });
        
        (spec.services || []).forEach(svc => {
            const providers = [
                ...(svc.providers || []),
                svc.class
            ];
            this._log.debug('creating service ${stringify(svc.class)}');
            let childInjector = injector.createChild(providers);
            
            let instance = childInjector.get(svc.class);
            result.push(instance);
        });
        
        return result;
    }
    
    /**
     * Try to find and load the NodeJS module that provides a given platform.
     * If the platform has already been loaded it is returned from the cache
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
    async bootstrapPlugin(platformName: string, plugin: Type<any>): Promise<Injector> {
        let pluginKey = `${platformName}-${plugin.name}`;
        if (this._pluginCache.has(pluginKey)) {
            return this._pluginCache.get(pluginKey)!;
        }
        
        let injector = bootstrapPlugin(plugin, this._injector);
        if (injector === null) {
            injector =  this._injector.createChild([]);
        }
        
        this._pluginCache.set(pluginKey, injector);
        
        return injector;
    }
    
    /**
     * Searches for a plugin or platform module with the given name within all
     * plugin directories. 
     *
     * If the optional parameter `disableNodeModule` is set to true, native NodeJS module
     * resolution won't be used.
     * 
     * @param name The name of the platform or plugin to search
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
                    
                    this._log.debug(`${name} found at ${p}`);
                    
                    return true;
                } catch (err) {
                    errs.push(err);
                    this._log.debug(`${name} tried path ${p}`)
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