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

Providers are responsible for defining injection targets and how the should be constructed. Each injector provides it's own set of injection providers and queries parent injectors if a dependency cannot be satisfied by the injector itself.  

Currently there are 4 different provider types available:

* ClassProvider
* FactoryProvider
* ExistingProvider
* ValueProvider
  
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
const barProvier: Provider = {
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




## Custom Injection targets

## Hierachical Injectors

## Optional parameters

## Visibility