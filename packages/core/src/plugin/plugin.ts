import {Type} from '../di';
import {makeDecorator} from '../utils/decorator';

export interface PluginDescriptor {
    /**
     * A set of provider to expose to the injector
     */
    providers?: any[];
    
    /**
     * A list of other plugins that should be loaded (if not already done)
     * and added to the same (or parent) injector
     */
    exports?: Type<any>[];
};

export interface PluginDecorator {
    (descr: PluginDescriptor): any;

    new(descr: PluginDescriptor): Plugin;
}

export interface Plugin {
    descriptor: PluginDescriptor;
}

export const Plugin: PluginDecorator = makeDecorator('Plugin', (descriptor) => ({descriptor}))