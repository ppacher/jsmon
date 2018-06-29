import {makeDecorator, makePropDecorator, Type, PROP_METADATA, ANNOTATIONS} from '@jsmon/core';

export interface ServerParameters {
    service: string;
}

export interface ServerDecorator {
    (settings: ServerParameters|string): any;

    new (settings: ServerParameters|string): Server;
}

export interface Server {
    service: string;
}

export const Server: ServerDecorator = makeDecorator('Server', (settings: ServerParameters|string) => {
    if (typeof settings === 'string') {
        return {
            service: settings
        };
    }
    
    return {service: settings.service};
});

export interface HandleDecorator {
    (settings: string): any;

    new (settings: string): Handle;
}

export interface Handle {
    methodName: string;
}

export const Handle: HandleDecorator = makePropDecorator('Handle', methodName => ({methodName}));

export function getServerMetadata(d: Type<any>): Server|undefined {
    const annotations = Object.getOwnPropertyDescriptor(d, ANNOTATIONS);
    if (annotations === undefined) {
        throw new Error(`missing @Server decorator`);
    }
    
    const meta = annotations.value;
    
    const settings: Server|undefined = meta.find((m: any) => m instanceof Server);
    
    return settings;
}

export function getServerHandlers(d: Type<any>): {[name: string]: Handle[]} {
    const annotations = Object.getOwnPropertyDescriptor(d, PROP_METADATA);

    if (annotations === undefined) {
        return {};
    }
    
    const metadata = {...annotations.value};
    
    Object.keys(metadata).forEach(key => {
        metadata[key] = metadata[key].filter((obj: any) => obj instanceof Handle);
    });
    
    return metadata;
}
