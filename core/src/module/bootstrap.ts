import {ReflectiveInjector, Type, Provider, getRootInjector} from '../di';
import {ANNOTATIONS} from '../utils/decorator';
import {Module, ModuleSettings, ModuleInstance, ModuleWithExports} from './module';
import {Logger, LOG_PREFIX} from '../logger';

export function bootstrapModule<T>(module: Type<T>): ModuleInstance<T> {
    return _bootstrapModule(module, null, undefined);
}

function _bootstrapModule<T>(module: Type<T>, rootInjector?: ReflectiveInjector, parentModule?: ModuleInstance<any>): ModuleInstance<T> {
    if (!rootInjector) {
        rootInjector = getRootInjector();
    }

    
    const settings = getModuleMetadata(module);
    const imports: ModuleInstance<any>[] = [];
    
    let moduleInjector = createModuleInjector(module, rootInjector, settings.providers);
    
    if (!!settings.exports && settings.exports.length > 0) {
        getRootInjector().addProvider([...settings.exports,
            Logger,
            {
                provide: LOG_PREFIX,
                useValue: 'root'
            }
        ]);
    }

    (settings.imports || []).forEach(imported => {
        let importedModule: Type<T>;
        
        if ('module' in imported) {
            let withExports = imported as ModuleWithExports;
            importedModule = withExports.module;
            // if the module has been imported as a ModuleWithExports we must
            // add all providers to the module injector
            moduleInjector.addProvider(withExports.exports || []);
        } else {
            importedModule = imported as Type<any>;
        }

        let importedInstance = !!parentModule ? parentModule.getImportedModuleInstance(importedModule) : null;
        
        if (importedInstance === null) {
            // If the module is not yet available, bootstrap it under the same parentModule
            importedInstance = _bootstrapModule(importedModule, rootInjector, parentModule);
        }
        
        // Push the instance to the list of imports
        imports.push(importedInstance);
    });

    const instance = moduleInjector.get<any>(module);
    const moduleInstance =  new ModuleInstance(instance, moduleInjector, imports, parentModule);

    Object.defineProperty(instance, '__module__', {
        value: moduleInstance
    });

    return moduleInstance;
}

function createModuleInjector(module: Type<any>, root: ReflectiveInjector, providers?: Provider[]): ReflectiveInjector {
    return root.resolveAndCreateChild([
        {
            provide: module,
            useClass: module,
        },
        {
            provide: Logger,
            useClass: Logger,
        },
        {
            provide: LOG_PREFIX,
            useValue: module.prototype.constructor.name,
        },
        ...(providers || [])
    ], module.prototype.constructor.name);
}

function getModuleMetadata(module: Type<any>): ModuleSettings|undefined {
    const annotations = Object.getOwnPropertyDescriptor(module, ANNOTATIONS);
    if (annotations === undefined) {
        throw new Error(`missing @Module decorator`);
    }
    
    const meta = annotations.value;
    const settings = meta.find(m => m instanceof Module) as Module;
    
    return settings ? settings.settings : undefined;
}