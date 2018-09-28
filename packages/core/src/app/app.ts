import {Provider} from '../di';
import {makeDecorator} from '../utils/decorator';

export interface AppDescriptor {
    /* A set of providers that should be added to the root injector */
    providers?: Provider[];
    
    /* A list of plugins that should be bootstrapped with the application */
    plugins?: any[];
}

export interface AppDecorator {
    (settings: AppDescriptor): any;
    new (settings: AppDescriptor): App;
}

export interface App {
    settings: AppDescriptor;
}

export const App: AppDecorator = makeDecorator('App', (settings) => ({settings}));