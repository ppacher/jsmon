import {Type} from '@jsmon/core';
import {PlatformParameters} from '@jsmon/platform';
import {existsSync, readFileSync} from 'fs';
import {resolve, extname} from 'path';
import {Observable} from 'rxjs/Observable';
import {share, map, startWith} from 'rxjs/operators';
import {_throw} from 'rxjs/observable/throw';
import {safeLoad} from 'js-yaml';
import {Watcher, FileWatcher} from './watcher';

export interface FeatureDefinition {
    /**
     * If the specified platform feature is a device, the `name` property
     * is used as the device name. For platform/plugin services this parameter
     * is ignored
     */
    name?: string;

    type: string;

    /**
     * An object or list of parameters to pass to the platform feature factory
     */
    params: PlatformParameters;
}

/**
 * Defines a platform that should be loaded as well as a list of 
 * features that should be boostrapped and added to the current
 * application
 */
export interface PlatformDefinition {
    /**
     * Path to the entry file of the plugin module. If omitted, the {@link PlatformLoader}
     * will try to auto-resolve the path to the entry point file
     */
    path?: string;

    /**
     * A set of platform features to bootstrap
     * Refer to the documentation of the used plugins/platforms to get a list
     * of feature names
     */
    enable: FeatureDefinition[];
}

export interface ConfigV1 {
    /** Version definition */
    version: 'v1alpha';
    
    /**
     * A list of directories to use for plugin resolution
     */
    pluginDirs?: string[];
    
    /**
     * If set to true, NodeJS plugin resolution is disabled
     */
    disableNodeModules?: boolean;

    /**
     * An object describing the plugins to load 
     * the key is interpreted as the plugin module name 
     * and used for module resolution
     */
    platforms: {
        [pluginName: string]: PlatformDefinition
    };
}

/**
 * Union type for config versions
 *
 * @docs-internal
 */
type VersionedConfig = ConfigV1;

export class Config {
    constructor(
        private _platforms: [string, PlatformDefinition][],
        private _pluginDirs: string[],
        private options: {
            disableNodeModules: boolean
        }
    ) {}

    /**
     * Creates a new {@link Config} instance from a {@link ConfigV1} object
     * 
     * @param cfg A {@link ConfigV1} object to create a config instance
     */
    static fromV1(cfg: ConfigV1): Config {
        let platforms: [string, PlatformDefinition][] = [];

        Object.keys(cfg.platforms).forEach(key => {
            let spec = cfg.platforms[key];
            platforms.push([key, spec]);
        });

        return new Config(platforms, cfg.pluginDirs || [], {
            disableNodeModules: cfg.disableNodeModules || false,
        });
    }
    
    get platforms(): [string, PlatformDefinition][] {
        return [...this._platforms];
    }
    
    /**
     * Iterate over all platform definitions and invoke a give callback
     * 
     * @param cb A callback function to invoke for each platform defined
     */
    forEachPlatform(cb: (name: string, pl: PlatformDefinition) => void): void {
        this._platforms.forEach(([name, def]) => cb(name, def));
    }
    
    forEachFeature(cb: (platformName: string, featureDef: FeatureDefinition) => void): void {
        this.forEachPlatform((name, def) => def.enable.forEach(feature => cb(name, feature)));
    }
    
    
    /**
     * Returns the list of defined plugin directories
     */
    pluginDirs(): string[] {
        return this._pluginDirs;
    }
    
    /**
     * Whether or not NodeJS module resolution is enabled
     */
    nodeModulesDisabled(): boolean {
        return this.options.disableNodeModules;
    }
}

export class ConfigLoader {
    private _watcher: Watcher;
    private _path: string;
    private _type: 'json'|'yaml'|'js';
    
    readonly onUpdate: Observable<Config>;

    constructor(pathToConfig: string, watcherCls: Type<Watcher>|null = FileWatcher) {
        let resolvedPath = resolve(pathToConfig);

        if (!existsSync(resolvedPath)) {
            throw new Error(`Config file ${resolvedPath} does not exist`);
        }
        
        this._path = resolvedPath;
        switch(extname(this._path).toLowerCase()) {
            case '.json':
                this._type = 'json';
                break;

            case '.yaml':
            case '.yml':
                this._type = 'yaml'
                break;

            case '.js':
                this._type = 'js';
                break;

            default:
                throw new Error(`Unsupported file type ${extname(this._path)}`);
        }
        
        if (watcherCls !== null) {
            this._watcher = new watcherCls();
            
            this.onUpdate = this._watcher.watch(resolvedPath)
                .pipe(
                    map(() => this.load()),
                    startWith(this.load()),
                    share()
                );
        } else {
            this.onUpdate = _throw(`No file watcher class provided`);
        }
    }
    
    /**
     * Loads the configuration file passed to the constructor and returns
     * a new {@link Config} instance
     */
    load(): Config {
        let content: string;
        
        if (this._type !== 'js') {
            content = readFileSync(this._path).toString();
        } else {
            delete require.cache[this._path];
        }
        
        let config: VersionedConfig;
        switch(this._type) {
            case 'json':
                config = JSON.parse(content);
                break;

            case 'yaml':
                config = safeLoad(content);
                break;

            case 'js':
                config = require(this._path);
                break;
        }

        return this._parse(config);
    }

    private _parse(cfg: VersionedConfig): Config {
        switch(cfg.version) {
            case 'v1alpha':
                return Config.fromV1(cfg);
            default:
                throw new Error(`Unsupported config version "${cfg.version}"`);
        }
    }
}