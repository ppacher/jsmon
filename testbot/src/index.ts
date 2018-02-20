import {ProviderKey, normalizeProvider, resolveProvider, Injectable, Injector, Inject, forwardRef} from '@homebot/core';
import {A, bootstrapApp, App} from '@homebot/core';
import {Foo, TestPlugin} from 'test-plugin/dist';

const token = 'mystring';

@App({
    providers: [
        A,
        Foo,
        {
            provide: forwardRef(() => 'test'),
            useValue: 'foo',
        },
        {
            provide: token,
            useExisting: 'test'
        }
    ],
    plugins: [
        TestPlugin
    ]
})
class Test {
    constructor(@Inject(forwardRef(() => Foo)) public f: Foo,
                public i: Injector,
                @Inject(token) public s: string) {
        this.check();
    }
    
    check() {
        if (!this.f) {
            throw Error(`Foo is missing`);
        }

        if (!this.i) {
            throw Error(`Injector is missing`);
        }

        if (this.s !== 'foo') {
            throw Error(`mystring is missing`);
        }

        console.log('Everything fine');
    }
}

bootstrapApp(Test);