import {Provider, Injector, Type} from '../di';
import {App, AppDescriptor} from './app';
import {ANNOTATIONS} from '../utils/decorator';
import {Plugin, bootstrapPlugin, PluginDescriptor} from '../plugin';

export function bootstrapApp<T>(app: Type<T>): T {
    const settings = getAppDescriptor(app);
    
    const appInjector = new Injector();

    if (!!settings) {
        (settings.providers || []).forEach(imported => {
            appInjector.provide(imported);
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
            appInjector.provide(p);
        });
        
        pluginDescriptor.bootstrapService.forEach((p: Provider) => {
            appInjector.get(p);
        });
    }

    appInjector.provide(app);

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
