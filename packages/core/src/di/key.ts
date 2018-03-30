import {stringify} from '../utils/utils';

export class ProviderKey {
    public readonly displayName: string;
    
    constructor(public readonly token: any, public readonly key: number) {
        this.displayName = stringify(token);
    }
    
    toString(): string {
        return this.displayName;
    }
    
    static get(token: Object): ProviderKey {
        return _globalKeyRegistry.getKey(token);
    }
}

class KeyRegistry {
    private _keys: Map<Object, ProviderKey> = new Map<Object, ProviderKey>();
    
    constructor() {}
    
    public getKey(token: Object): ProviderKey {
        if (token instanceof ProviderKey) {
            return token;
        }
        
        if (this._keys.has(token)) {
            return this._keys.get(token)!;
        }
        
        const key = new ProviderKey(token, this.numberOfKeys);
        
        // TODO: remove once we release it
        Array.from(this._keys.values()).map(val => {
            if (val.displayName === key.displayName) {
                throw new Error(`ProviderKey: duplicated display name: ${val.displayName}`);
            }
        });
        
        this._keys.set(token, key);
        
        return key;
    }
    
    get numberOfKeys(): number {
        return this._keys.size;
    }
}

const _globalKeyRegistry = new KeyRegistry();