import {Provider, Injector, Type, normalizeProvider} from '../di';
import {App, AppDescriptor} from './app';
import {ANNOTATIONS} from '../utils/decorator';
import {Plugin, collectProviders, PluginDescriptor} from '../plugin';

export function bootstrapApp<T>(app: Type<T>): T {
    const settings = getAppDescriptor(app);
    
    const providers: Set<any> = new Set();;
    const plugins: Set<any> = new Set();
    let bootstrap: any[] = [];
    
    const rootInjector = new Injector([]);
    
    if (!!settings) {
        (settings.plugins||[]).forEach(plugin => {
            bootstrap = bootstrap.concat(collectProviders(plugin, rootInjector, null, providers, plugins));
        });
        
        (settings.providers||[]).forEach(provider => {
            providers.add(provider);
        });
    }
    
    providers.add(app);
    
    let appInjector = rootInjector.createChild(Array.from(providers.values()));
    
    Array.from(plugins.values()).forEach(plugin => appInjector.get(plugin));

    bootstrap.forEach(svc => appInjector.get(svc));

    return appInjector.get(app);
}

function getAppDescriptor(module: Type<any>): AppDescriptor|undefined {
    const annotations = Object.getOwnPropertyDescriptor(module, ANNOTATIONS);
    if (annotations === undefined) {
        throw new Error(`missing @Module decorator`);
    }
    
    const meta = annotations.value;
    const settings = meta.find((m: any) => m instanceof App) as App;
    
    return settings ? settings.settings : undefined;
}
