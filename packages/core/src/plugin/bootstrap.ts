import {Plugin, PluginDescriptor} from './plugin';
import {ANNOTATIONS} from '../utils/decorator';
import {normalizeProvider, Provider, Type, Injector, Visibility} from '../di';
import {stringify} from '../utils/utils';

export function bootstrapPlugin(plugin: Type<any>, injector: Injector, visibility: Visibility = null): Injector|null {
    // We can bail out if the injector has already loaded the plugin
    if (injector.has(plugin, visibility)) {
        return null;
    }
    
    let providers = new Set<any>();
    let plugins = new Set<Type<any>>();
    
    collectProviders(plugin, injector, visibility, providers, plugins);
    
    let child = injector.createChild(Array.from(providers.values()));
    
    // create all plugins
    Array.from(plugins.values()).reverse().forEach(plugin => {
        child.get(plugin);
    });
    
    return child;
}

export function collectProviders(plugin: Type<any>, injector: Injector, visibility: Visibility, providers: Set<any>, plugins: Set<any>): void {
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
        collectProviders(e, injector, visibility, providers, plugins);
    });
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