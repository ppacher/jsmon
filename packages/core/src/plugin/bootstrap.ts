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
    
    let bootstrap = collectProviders(plugin, injector, visibility, providers, plugins);
    
    let child = injector.createChild(Array.from(providers.values()));
    
    // create all plugins
    Array.from(plugins.values()).reverse().forEach(plugin => {
        child.get(plugin);
    });

    // boostrap all services
    bootstrap.reverse().forEach(svc => {
        child.get(svc);
    });
    
    return child;
}

export function collectProviders(plugin: Type<any>, injector: Injector, visibility: Visibility, providers: Set<any>, plugins: Set<any>): any[] {
    let svcs: any[] = [];
    
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

    desc.bootstrapService!.forEach(svc => {
        svcs.push(svc);
    });
    
    desc.exports!.forEach(e => {
        let exportedServices = collectProviders(e, injector, visibility, providers, plugins);
        
        svcs = svcs.concat(exportedServices);
    });
    
    return svcs;
}

export function getPluginDescriptor<T>(plugin: Type<T>): PluginDescriptor {
    const settings = _getPluginDescriptor(plugin);
    
    if (settings === undefined) {
        throw new Error(`foo: missing @Plugin decorator for ${stringify(plugin)}`);
    }
    
    if (!settings.bootstrapService) {
        settings.bootstrapService = [];
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