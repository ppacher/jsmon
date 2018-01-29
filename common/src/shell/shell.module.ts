import {Module} from '@homebot/core';
import {ShellService, ShellAdapter} from './shell.service';
import {LinuxShellAdapter} from './shell.linux';

@Module({
    exports: [
        ShellService,
        {
            provide: ShellAdapter,
            useClass: LinuxShellAdapter,
        }
    ]
})
export class ShellModule {

}