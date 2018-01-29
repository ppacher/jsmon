import {makeDecorator} from '../utils/decorator';
import {Provider, Type, Injector} from '../di';

export interface ModuleSettings {
    /** Providers for the module injector */
    providers?: Provider[];
    
    /** A set of DI providers to provide on the first importing module */
    exports?: Provider[];
    
    /** A set of required modules */
    imports?: (Type<any>|ModuleWithExports)[];
}

/**
 * Type for the @Module decorator
 */
export interface ModuleDecorator {
    (settings: ModuleSettings): any;
    new (settings: ModuleSettings): Module;
}

/**
 * Type for the Module metadata
 */
export interface Module {
    settings: ModuleSettings;
}

/**
 * The @Module decorator
 */
export const Module: ModuleDecorator = makeDecorator('Module', (settings) => ({settings}));

export class ModuleInstance<T> {
    constructor(public readonly instance: T,
                public readonly injector: Injector,
                public readonly imports: ReadonlyArray<ModuleInstance<any>>,
                public readonly parent: ModuleInstance<any>|null = null) {}
    
    hasImported(module: Type<any>): boolean {
        let imported = this.imports.find(instance => instance.instance instanceof module);
        
        if (imported !== undefined) {
            return true;
        }
        
        if (this.parent !== null) {
            return this.parent.hasImported(module);
        }

        return false;
    }
}

export interface ModuleWithExports {
    /** The module to export */
    module: Type<any>;
    
    /** A set of provides for the importing module */
    exports: Provider[]; 
}