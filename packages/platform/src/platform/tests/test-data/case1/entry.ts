import {Plugin, Injectable} from '@homebot/core';
import {PlatformSpec} from '../../../factory';
import {Device} from '../../../../devices';
import { setTimeout } from 'timers';

@Injectable()
export class DummyService {
    static instances: number = 0;
    
    constructor() {
        console.log('DummyService created');
        DummyService.instances = DummyService.instances + 1;
    }
}

@Injectable()
export class AnotherService {

}

@Device({
    description: 'foobar'
})
export class DummyDevice {
    constructor(public svc: AnotherService) {}
}

@Plugin({
    providers: [DummyService],
})
export class Case1Plugin {
    constructor(private dummy: DummyService) {
        console.log('Case1Plugin called');
    }
}

function factory(params: any): PlatformSpec {
    return {
        plugin: Case1Plugin,
        services: [{
            class: AnotherService,
        }],
        devices: [
            {
                class: DummyDevice,
                name: 'dummy',
                providers: [AnotherService]
            }
        ]
    }
}

function factory2(): Promise<PlatformSpec> {
    return new Promise<PlatformSpec>((resolve) => {
        setTimeout(() => resolve({plugin: Case1Plugin}), 500);
    });
};

export const homebot = {
    'case1': factory,
    'case2': factory2,
};