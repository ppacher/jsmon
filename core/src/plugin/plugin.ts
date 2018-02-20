import {makeDecorator} from '../utils/decorator';

export interface PluginDescriptor {
    bootstrapService?: any[];
    providers?: any[];
};

export interface PluginDecorator {
    (descr: PluginDescriptor): any;

    new(descr: PluginDescriptor): Plugin;
}

export interface Plugin {
    descriptor: PluginDescriptor;
}

export const Plugin: PluginDecorator = makeDecorator('Plugin', (descriptor) => ({descriptor}))