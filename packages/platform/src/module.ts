import {Plugin} from '@homebot/core';
import {PlatformLoaderModule} from './platform';
import {DeviceManagerModule} from './devices';

@Plugin({
    exports: [
        PlatformLoaderModule,
        DeviceManagerModule,
    ]
})
export class PlatformModule {}