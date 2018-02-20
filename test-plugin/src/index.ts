import {ProviderKey, Injectable, Plugin, Foo} from '@homebot/core';
export {Foo} from '@homebot/core';

export class BarDep {

}

@Injectable()
export class Bar {
    constructor(public f: Foo, public bar: BarDep) {
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