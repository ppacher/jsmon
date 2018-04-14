import {Plugin} from '@homebot/core';
import {PlatformLoader} from './loader';

@Plugin({
    providers: [PlatformLoader]
})
export class PlatformLoaderModule {}