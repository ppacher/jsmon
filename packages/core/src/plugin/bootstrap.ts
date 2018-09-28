import {Plugin, PluginDescriptor} from './plugin';
import {ANNOTATIONS} from '../utils/decorator';
import {normalizeProvider, Provider, Type, Injector, Visibility} from '../di';
import {stringify} from '../utils/utils';

export class ResolvedPlugin {
    constructor(public readonly providers: ReadonlyArray<Provider>,
                public readonly plugins: ReadonlyArray<Type<any>>) {}
}

export class PluginInstance<T> {
    constructor(public readonly instance: T,
                public readonly injector: Injector,
                public readonly imports: any[]) {}
}

export class PluginBootstrap {
    private readonly _providers: Set<Provider> = new Set();
    private readonly _plugins: Set<Type<any>> = new Set();

    constructor(private _rootInjector: Injector) {}
    
    resolve(plugins: Type<any>|Type<any>[]): ResolvedPlugin {
        if (!Array.isArray(plugins)) {
            plugins = [plugins];
        }
        
        plugins.forEach(plugin => {
            PluginBootstrap._collectProviders(plugin, this._rootInjector, null, this._providers, this._plugins);
        });
        
        return new ResolvedPlugin(
            Array.from(this._providers),
            Array.from(this._plugins)
        );
    }
    
    static bootstrap<T>(plugin: Type<T>, injector: Injector, visibility: Visibility = null): PluginInstance<T> {
        const bootstrap = new PluginBootstrap(injector);
        const resolvedPlugin = bootstrap.resolve(plugin);
        
        // create a child injector using all resolved providers
        const childInjector = injector.createChild(resolvedPlugin.providers as Provider[]);
        
        // create all plugins that have been imported
        const imports = resolvedPlugin.plugins
            .filter(p => p !== plugin)
            .map(p => childInjector.get(p));
            
        // create the plugin instance itself
        const pluginInstance = childInjector.get<T>(plugin);

        return new PluginInstance(pluginInstance, childInjector, imports);
    }

    private static _collectProviders(plugin: Type<any>, injector: Injector, visibility: Visibility, providers: Set<Provider>, plugins: Set<Type<any>>): void {
        let desc = getPluginDescriptor(plugin);
        
        if (!plugins.has(plugin) && !injector.has(plugin)) {
            plugins.add(plugin);
            providers.add(plugin);
        }

        desc.providers!.forEach(p => {
            const n = normalizeProvider(p);

            if (!injector.has(n.provide)) {
                providers.add(p);
            }
        });
        
        desc.exports!.forEach(e => {
            PluginBootstrap._collectProviders(e, injector, visibility, providers, plugins);
        });
    }
}

export function getPluginDescriptor<T>(plugin: Type<T>): PluginDescriptor {
    const settings = _getPluginDescriptor(plugin);
    
    if (settings === undefined) {
        throw new Error(`foo: missing @Plugin decorator for ${stringify(plugin)}`);
    }
    
    if (!settings.providers) {
        settings.providers = [];
    }
    
    if (!settings.exports) {
        settings.exports = [];
    }

    return settings!;
}

function _getPluginDescriptor(module: Type<any>): PluginDescriptor|undefined {
    const annotations = Object.getOwnPropertyDescriptor(module, ANNOTATIONS);
    if (annotations === undefined) {
        throw new Error(`missing @Plugin decorator for ${stringify(module)}`);
    }
    
    const meta = annotations.value;
    const settings = meta.find((m: any) => m instanceof Plugin) as Plugin;
    
    return settings ? settings.descriptor : undefined;
}