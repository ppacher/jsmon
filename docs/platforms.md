# Platforms

A platform is a NodeJS module that provides access to one or more specific kinds of devices or services. 

## Creating a platform

Each platform is basically a `@jsmon/core:Plugin` (see [here](toto)) but is meant
to be dynamically loaded during runtime. 

For the runtime loading to work, a platform's `package.json` file needs to provide some additional
information for the platform loader. 

```json
{
    "name": "my-platform",
    "main": "index.js",
    "scripts": {
        "...": "..."
    },
    "jsmon": {
        "entry": "platforms.js"
    }
}
```

The `jsmon` object within the `package.json` file is used by the loader to check if a NodeJS module
provides a platform for HomeBot. 
The optional `entry` property specifies the entry file for the loader to use. If it's omitted, the `main` property of the JSON file will be used. The reason for this separation is that modules can provide generic services to be used by non-platform projects (ie. not using the `@jsmon/platform` module) without the need to satisfy all `peerDependencies` (as they are not included/exported by the file specified in `main`).

The `entry` file should export a `jsmon` property that provides factory functions for different devices and services the platform supports. For example: 

```typescript
import {PlatformParameters, PlatformSpec} from '@jsmon/platform';
import {FireTVPlugin} from './plugins';
import {FireTV, FireTVConfig} from './devices/firetv';

function FireTVFactory(params: PlatformParameters): PlatformSpec {
    return {
        plugin: FireTVPlugin,
        devices: [
            {
                cls: FireTV,
                provides: [
                    FireTVConfig.provide(params),
                ]
            }
        ]
    }
}

export const jsmon {
    'firetv':  FireTVFactory
}
```

As shown in the above example, the factory function for `firetv` returns a `PlatformSpec` that describes the parent plugin to load (again, see [the documentation for plugins](todo)) as well as a set of `devices` to bootstrap. The `device` property is a list of `DeviceSpec`s that defines the class of the device as well as any additional providers for the dependency injection.

Given the module name of the platform is `my-firetv-platform`, users can load and use the devices easily:

```typescript
import {PlatformLoader, PlatformModule, DeviceManager} from '@jsmon/platform';
import {App, bootstrapApp} from '@jsmon/core';

@App({
    imports: {
        PlatformModule,
    }
})
export class App {
    constructor(loader: PlatformLoader, manager: DeviceManager) {
        loader.bootstrap('my-firetv-platform', [
            {
                name: 'FireTV Livingroom',
                host: '192.168.0.100',
            },
            {
                name: 'FireTV Bedroom',
                host: '192.168.0.101',
            }
        ]).then(() => {
            // Now there are two new devices registered at the DeviceManager

            manager.watchSensor('FireTV LivingRoom', 'state')
                .subscribe(state => console.log('State' + state));
        });
    }
}

// This will setup the dependency injector as well as any imported plugins (ie. in this example the PlatformModule)
bootstrapApp(App);

```