import {Type, Provider} from '@jsmon/core';

/**
 * Definition of a platform device returned by the a platform factory
 */
export interface DeviceSpec {
    /** The class of that provides the device implementation */
    class: Type<any>,
    
    /** The name for the device */
    name: string;

    /** An optional description of the device */
    description?: string;
    
    /**
     * Additional providers for the dependency injection used when
     * creating a new instance of `class`
     */
    providers?: Provider[]
}

export interface ServiceSpec {
    /** The class of the service implementation that should be created */
    class: Type<any>;
    
    /**
     * Additional providers for the dependency injection used when
     * creating a new instance of `class`
     */
    providers?: Provider[];
}

export interface PlatformSpec {
    /**
     * The plugin class that should be loaded when creating instances of
     * devices or services
     */
    plugin?: Type<any>;
    
    /**
     * A list of devices that should be created
     */
    devices?: DeviceSpec[];
    
    /**
     * A list of services that should be created
     */
    services?: ServiceSpec[];
}

export interface PlatformParameters {
    [key: string]: any;
};

export interface PlatformFactory {
    (params: PlatformParameters): PlatformSpec|Promise<PlatformSpec>;
}

/**
 * Platforms must export a jsmon constant with type PlatformFactories 
 * within the `entry` file of the platform
 */
export interface PlatformFactories {
    [featureName: string]: PlatformFactory;
}

/**
 * Definition of the package.json extension for HomeBot
 */
export interface HomeBotPlatformExtension {
    main: string;

    jsmon: {
        entry?: string;
    }
}