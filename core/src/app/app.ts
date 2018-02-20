import {Provider} from '../di';
import {makeDecorator} from '../utils/decorator';

export interface AppDescriptor {
    providers?: Provider[];
    
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