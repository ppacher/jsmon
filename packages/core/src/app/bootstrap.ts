import {Provider, Injector, Type, normalizeProvider} from '../di';
import {App, AppDescriptor} from './app';
import {ANNOTATIONS} from '../utils/decorator';
import {Plugin, bootstrapPlugin, PluginDescriptor} from '../plugin';

export function bootstrapApp<T>(app: Type<T>): T {
    const settings = getAppDescriptor(app);
    const providers: Provider[] = [];
    const bootstrap: any[] = [];

    if (!!settings) {
        (settings.providers || []).forEach(imported => {
            providers.push(imported);
        });
        
        let plugins = settings.plugins || [];

        let pluginDescriptor = plugins.reduce((result, plugin) => {
            let desc = bootstrapPlugin(plugin);

            return {
                bootstrapService: [
                    ...result.bootstrapService,
                    ...desc.bootstrapService!,
                ],
                providers: [
                    ...result.providers,
                    ...desc.providers!,
                ]
            };
        }, {
            bootstrapService: [],
            providers: [],
        } as PluginDescriptor);

        pluginDescriptor.providers.forEach((p: Provider) => {
            providers.push(p);
        });
        
        pluginDescriptor.bootstrapService.forEach((p: Provider) => {
            let n = normalizeProvider(p);

            bootstrap.push(n.provide);
        });
    }

    providers.push(app);
    const appInjector = new Injector(providers);
    
    bootstrap.forEach(token => appInjector.get(token));

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
