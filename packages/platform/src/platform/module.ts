import {Plugin} from '@jsmon/core';
import {PlatformLoader} from './loader';

@Plugin({
    providers: [PlatformLoader]
})
export class PlatformLoaderModule {}