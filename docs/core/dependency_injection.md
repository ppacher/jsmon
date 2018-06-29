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

## Custom Injection targets

## Hierachical Injectors