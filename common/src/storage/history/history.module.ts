import {Module} from '@homebot/core';
import {HistoryService} from './history.service';
import {DeviceManagerModule} from '../../device-manager';

@Module({
    imports: [
        DeviceManagerModule
    ],
    exports: [
        HistoryService
    ]
})
export class HistoryModule {
    constructor() {
        console.log(`[history] module bootstrapped`);
    }
}