# `@jsmon/core`: Dependency Injection

The depdendency injection framework in `@jsmon/core` is based on Angular2, thanks to the great people at Google and the Angular team.


The `@jsmon/core` dependency injection is built upon the concept of an hierachical dependency injector tree using injection providers.

The following provides a simple example of how DI can be used:

```typescript
import {Injectable, Injector} from '@jsmon/core';

@Injectable()
export class Engine {
    public turnOn() {
        console.log(`Engine turned on`);
    }
}

@Injectable()
export class Car {
    constructor(private _engine: Engine) {}

    turnOn() {
        this._engine.turnOn();
    }
}

const injector = new Injector([
    Engine,
    Car
]);

const car: Car = injector.get(Car);

car.turnOn();
// should print: Engine turned on

```

## Providers

Providers are responsible for defining injection targets and how they should be constructed. Each injector provides it's own set of injection providers and queries parent injectors if a dependency cannot be satisfied by the injector itself.  

Currently there are 4 different provider types available:

* [ClassProvider](#classprovider)
* [FactoryProvider](#factoryprovider)
* [ValueProvider](#valueprovider)
* [ExistingProvider](#existingprovider)

There's also a more [complete example](#example) at the end of the section.
  
All of them are part of the `Provider` type exposed by `@jsmon/core/di`.

### ClassProvider

When resolving dependecies of a class constructor, the injector will create a new instace for each dependency that is provided by a `ClassProvider` (and will recursively resolve the providers dependecies).

```typescript
import {Provider, Injector} from '@jsmon/core';

class Foo {
    constructor() {
        console.log(`Foo created`);
    }
}

@Injectable()
class Bar {
    constructor(foo: Foo) {
        console.log(`Got instance of Foo: `, foo);
    }
}

// A the class type can be directly used as the Provider
const fooProvider: Provider = Foo;

// One can also directly specify a class provider using a different token
// See `Custom Injetion targets` for more information
const barProvider: Provider = {
    provide: Bar,
    useClass: Bar
};

const injector = new Injector([fooProvider, barProvider]);

const b: Bar = injector.get(Bar);
// should print:
//
//  Foo created
//  Got instance of Foo: xxx
//
```

In the above example, if `class Foo` would have constructor parameters the dependecy injector would try to resolve them as well.

### FactoryProvider

Factory providers can be used if custom logic is required when constructing dependency injection target. 

> **Note**: currently FactoryProviders cannot have an dependencies. This will be fixed soon.

```typescript
import {Provider, Injector} from '@jsmon/core';

abstract class MyClass {
    value: string;
}

const tokenProvider: Provider = {
    provide: MyClass,
    useFactory: () => {
        return {
            value: 'foobar';
        }
    }
}

const injector = new Injector([tokenProvider]);

const token = injector.get(MyClass).value;
console.log(token);

// should print
//
//  'foobar'
```

### ValueProvider

A ValueProvider registeres an injection target that receives a constant/pre-created value. The following example uses an abstract class definition as well as [Custom Injection targets](#custom-injection-targets).

```typescript
import {Provider, Injector, Inject} from '@jsmon/core';

abstract class Token extends string {}

const XSRFToken = 'xxxx-yyyy-zzzz';

class Example {
    constructor(
        token: Token,
        @Inject('XSRF') xsrf: string,
    ) {
        assert(token === xsrf);
    }
}

const injector = new Injector([
    {
        provide: 'XSRF',
        useValue: XSRFToken,
    },
    {
        provide: Token,
        useValue: XSRFToken
    }
]);

const token = injector.get(Token);
const xsrf = injector.get('XSRF');

assert(token === xsrf);

const example: Example = injector.get(Example);

```

### ExistingProvider

An `ExistingProvider` can be used when the injection target is already provided but with a different injection token.
When the injector encounters an `ExistingProvider` it will re-use the already created instance the provider refers to or
create a new one.

```typescript
import {Provider, Injector} from '@jsmon/core';

abstract class Logger {
    abstract log(...args: any[]): void;
}

class MyLogger extends Logger {
    log(...args: any[]) {
        console.log(...args);
    }
}

const injector = new Injector([
    MyLogger, // this is a ClassProvider/TypeProvider
    {
        provide: Logger,
        useExisting: MyLogger
    }
])

const log1 = injector.get(MyLogger);
const log2 = injector.get(Logger);

assert(log1 === log2);
```

### Example

```typescript
import {Provider, Injector} from '@jsmon/core';

export abstract class Console {
    abstract log(...args: any[]);
}

// A value provider for console
export const ConsoleProvider: Provider = {
    provide: Console,
    useValue: console,
};

export abstract class LoggingAdapter {
    abstract log(...args: any[]);
}

export class ConsoleLogger extends LoggingAdapter {
    constructor(private console: Console) {}
    
    log(...args: any[]): void {
        this.console.log(...args);
    }
}

export class Logger {
    constructor(private adapter: LoggingAdapter)

    log(...args: any[]): void {
        this.adapter.log(...args);
    }
}

const injector = new Injector([
    ConsoleProvider, // ValueProvider
    ConsoleLogger, // Class/Type Provider
    {
        provide: LoggingAdapter,
        useExisting: ConsoleLogger,
    },
    Logger
]);

const logger = injector.get(Logger);
//
// logger will receive ConsoleLogger as it's LoggingAdapter and
// ConsoleLogger will get the `console`.
//

```
## Custom Injection targets

## Hierachical Injectors

## Optional parameters

## Visibility