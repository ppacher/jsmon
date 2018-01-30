import {stringify} from '../utils';

export class ReflectiveKey {
    public readonly name: string;

    constructor(public readonly token: any, public readonly key: number) {
        if (!token) {
            throw new Error(`Invalid token for ReflectiveKey`);
        }
        
        this.name = stringify(this.token);
    }
    
    static get(token: Object): ReflectiveKey {
        return _globalKeyRegistry.get(token);
    }
    
    static get numberOfKeys(): number {
        return _globalKeyRegistry.numberOfKeys;
    }
}

export class ReflectiveKeyRegistry {
    private readonly _keys = new Map<Object, ReflectiveKey>();

    get(token: Object): ReflectiveKey {
        if (token instanceof ReflectiveKey) {
            return token;
        }
        
        if (this._keys.has(token)) {
            return this._keys.get(token);
        }
        
        const newKey = new ReflectiveKey(token, this.numberOfKeys);
        this._keys.set(token, newKey);
        
        return newKey;
    }

    get numberOfKeys(): number { return this._keys.size; }
}

const _globalKeyRegistry = new ReflectiveKeyRegistry();