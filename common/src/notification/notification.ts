import {notify} from 'node-notifier';
import {Module, Injectable} from '@homebot/core';

@Injectable()
export class NotificationService {
    constructor() {}
    
    async notify(title: string, message: string): Promise<any> {
        return new Promise<any>((resolve, _) => {
            notify({
                wait: true,
                title: title,
                message: message,
            }, () => resolve());
        });
    }
}

@Module({
    exports: [
        NotificationService
    ]
})
export class NotificationModule {
}