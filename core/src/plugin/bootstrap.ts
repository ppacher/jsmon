import {Plugin, PluginDescriptor} from './plugin';
import {ANNOTATIONS} from '../utils/decorator';
import {Type, Injector} from '../di';
import {stringify} from '../utils/utils';

export function bootstrapPlugin<T>(plugin: Type<T>): PluginDescriptor {
    const settings = getPluginDescriptor(plugin);
    
    if (settings === undefined) {
        throw new Error(`foo: missing @Plugin decorator for ${stringify(plugin)}`);
    }
    
    if (!settings.bootstrapService) {
        settings.bootstrapService = [];
    }
    
    if (!settings.providers) {
        settings.providers = [];
    }

    return settings;
}

export function getPluginDescriptor(module: Type<any>): PluginDescriptor|undefined {
    const annotations = Object.getOwnPropertyDescriptor(module, ANNOTATIONS);
    if (annotations === undefined) {
        throw new Error(`missing @Plugin decorator for ${stringify(module)}`);
    }
    
    const meta = annotations.value;
    const settings = meta.find((m: any) => m instanceof Plugin) as Plugin;
    
    return settings ? settings.descriptor : undefined;
}