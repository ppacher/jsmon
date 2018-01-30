import {ReflectiveKey} from '../src/di/reflective_key';

describe('ReflectiveKey', () => {
    it('should return the same key for identical string tokens', () => {
        let token1 = 'Foobar';
        let token2 = 'Bar';
        let token3 = 'Foobar';
        
        const key1 = ReflectiveKey.get(token1);
        const key2 = ReflectiveKey.get(token2);
        const key3 = ReflectiveKey.get(token3);
        
        expect(key1).not.toBe(key2);
        expect(key1).toBe(key3);
    });
    
    it('should return the same key for identical classes', () => {
        let cls1 = class Foo {};
        let cls2 = cls1;
        let cls3 = class Bar {};
        
        const key1 = ReflectiveKey.get(cls1);
        const key2 = ReflectiveKey.get(cls2);
        const key3 = ReflectiveKey.get(cls3);
        
        expect(key1).not.toBe(key3);
        expect(key1).toBe(key2);
    });

    it('should use a meaningful name', () => {
        expect(ReflectiveKey.get('foo').name).toBe('foo');
        expect(ReflectiveKey.get(class Foo{}).name).toBe('Foo');
        expect(ReflectiveKey.get(10).name).toBe('10');
        expect(ReflectiveKey.get({name: 'barFoo'}).name).toBe('barFoo');
    });
    
    it('should created unique identifiers', () => {
        const k1 = ReflectiveKey.get('foo');
        const k2 = ReflectiveKey.get('FOO');
        const k3 = ReflectiveKey.get(class FOO{});

        expect(k1.key).not.toBe(k2.key);
        expect(k3.key).not.toBe(k2.key);
    });
});