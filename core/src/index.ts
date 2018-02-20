export * from './app';
export * from './di';
export * from './plugin';


import {ProviderKey, Injectable} from './di';

@Injectable()
export class A {

}

@Injectable()
export class Foo {
    constructor(public a: A) {}
}