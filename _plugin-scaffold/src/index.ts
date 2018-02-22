import {ProviderKey, Injectable, Plugin} from '@homebot/core';

export class BarDep {

}

@Injectable()
export class Bar {
    constructor(public bar: BarDep) {
        console.log('Bar created');
    }
}

@Plugin({
    providers: [
        Bar,
        BarDep
    ],
    bootstrapService: [
        Bar
    ]
})
export class TestPlugin {}