import { Injector, Type, Provider } from '../di';
import { collectProviders } from '../plugin';
import { ANNOTATIONS } from '../utils/decorator';
import { App, AppDescriptor } from './app';
import { LoggingAdapter, Logger, useLoggingAdapter } from '../log';

export class Bootstrap {
    private _rootInjector?: Injector;
    private _loggingAdapter?: LoggingAdapter;
    private _logger?: Logger;
    private _providers: Provider[] = [];
    
    /**
     * Set a root injector to be use for the app instance
     * 
     * @param inj The injector to use for the new app instance
     */
    withInjector(inj: Injector): this {
        this._rootInjector = inj;
        return this;
    }
    
    /**
     * Add a list of dependency injection providers
     * 
     * @param providers A list of {@link Provider} for the DI
     */
    withProviders(providers: Provider[]): this {
        this._providers = this._providers.concat(providers);
        return this;
    }
    
    /**
     * Add a dependency injection provider
     * 
     * @param provider A {@link Provider} for the DI
     */
    withProvider(provider: Provider): this {
        this._providers.push(provider);
        return this;
    }
    
    /**
     * Set a logging adapter for the application instance
     * This will automatically add a {@link Logger} provider
     * Note: an already existing injection provider for {@link Logger}
     * will be shadowed and a new instance will be created using the
     * provided LoggingAdapter.
     * 
     * If passing a Logger instance is required, use withLogger
     * 
     * @param log The logging adapter to use
     */
    withLoggingAdapter(log: LoggingAdapter): this {
        if (!!this._logger) {
            throw new Error(`withLogger() has already been called`);
        }
        this._loggingAdapter = log;
        return this;
    }
    
    /**
     * Set a logger instance for the application that will be provided
     * by the dependency injector using the {@link Logger} token
     *
     * (see {@link Bootstrap#withLoggingAdapter})
     * 
     * @param log The logger instance to use
     */
    withLogger(log: Logger): this {
        if (!!this._loggingAdapter) {
            throw new Error(`withLoggingAdapter() has already been called`);
        }
        this._logger = log;
        return this;
    }
    
    create<T>(app: Type<T>): T {
        let rootInjector = this._rootInjector || new Injector([]);
        
        if (!!this._loggingAdapter) {
            rootInjector = rootInjector.createChild([
                useLoggingAdapter(this._loggingAdapter),
                Logger,
                ...this._providers
            ]);
        } else if (!!this._logger) {
            rootInjector = rootInjector.createChild([
                {
                    provide: Logger,
                    useValue: this._logger,
                },
                ...this._providers
            ]);
        }
        
        return bootstrapApp(app, rootInjector);
    }
    
    static create<T>(app: Type<T>): T {
        return new Bootstrap().create(app);
    }
}

export function bootstrapApp<T>(app: Type<T>, rootInjector: Injector = new Injector([])): T {
    const settings = getAppDescriptor(app);
    
    const providers: Set<any> = new Set();;
    const plugins: Set<any> = new Set();
    
    if (!!settings) {
        (settings.plugins||[]).forEach(plugin => {
            collectProviders(plugin, rootInjector, null, providers, plugins);
        });
        
        (settings.providers||[]).forEach(provider => {
            providers.add(provider);
        });
    }
    
    providers.add(app);
    
    let appInjector = rootInjector.createChild(Array.from(providers.values()));
    
    Array.from(plugins.values()).forEach(plugin => appInjector.get(plugin));

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

/**
 * Checks wether a given class is decorated with the App decorator
 * 
 * @param module The class to check
 */
export function isApplication(module: Type<any>): boolean {
    return getAppDescriptor(module) !== undefined;
}