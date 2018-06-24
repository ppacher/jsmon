import {FlagDescriptor} from './app';

export class FlagValue {
    constructor(private readonly _raw: string) {}
    
    string(): string { return this._raw; }
};

export abstract class FlagSet {
    /** Returns a FlagValue for the flag with the given name */
    abstract getFlag(name: string): FlagValue;
    
    abstract getArgByName(name: string): FlagValue;

    abstract getArgByIdx(idx: number): FlagValue;

    abstract countArgs(): number;
}

class _FlagSet extends FlagSet {
    private _flags: {def: FlagDescriptor, value: string}[] = [];

    constructor(private _def: FlagDescriptor[], params?: string[]) {
        super();
        
        if (!params) {
            params = process.argv;
        }
        
        this._parse(params);
    }

    getFlag(name: string): FlagValue {
        return new FlagValue(this._flags.find(f => f.def.name == name).value);
    }
    

    getArgByName(name: string): FlagValue {
        return null;
    }
    
    getArgByIdx(idx: number): FlagValue {
        return null;
    }
    
    countArgs(): number {
        return 0;
    }
    
    private _parse(params: string[]) {
        for(let i = 0; i < params.length; i++) {
            let flag = params[i];
            let flagName = '';
            let flagValue = '';

            if (flag.startsWith('-')) {
                [flagName, flagValue] = this._parseFlag(flag);
            }

            let def = this._getDefinition(flagName); 
            
            if (!!def.boolean) {
                if (flagValue === '') {
                    this._setFlag(def, 'true');
                } else {
                    if (flagValue !== 'true' && flagValue !== 'false') {
                        throw new Error(`Invalid value for boolean flag ${flagName}: ${flagValue}`);
                    }
                    this._setFlag(def, flagValue);
                }
                
                continue;
            }
            
            if (flagValue !== '') {
                this._setFlag(def, flagValue);
                continue;
            }
            
            // we didn't have the flag value yet, use the next parameter
            i++;
            if (params.length < i) {
                throw new Error(`Missing value for parameter ${flagName}`);
            }
            
            flagValue = params[i];
            
            this._setFlag(def, flagValue);
        }
    }

    private _parseFlag(flag: string): [string, string] {
        let flagParts: string[] = [];
        let flagName = '';
        let flagValue = '';
        
        let isLongOption = flag.startsWith('--');

        if (flag.includes('=')) {
            flagParts = flag.split('=');
            
            flagName = flagParts[0].slice(isLongOption ? 2 : 1);
            
            if (!isLongOption && flagName.length > 1) {
                throw new Error(`Invalid flag specified: ${flagName}`);
            }
            
            if (flagParts[1] === '') {
                throw new Error(`Invalid argument for ${flagName}`);
            }                    
            
            flagValue = flagParts.slice(1).join('=');
        } else {
            flagName = flag.slice(isLongOption ? 2 : 1);
            
            if (!isLongOption) {
                flagValue = flagName.slice(1);
                flagName = flagName[0];
            }
        }

        return [flagName, flagValue];
    }

    private _getDefinition(flagName: string): FlagDescriptor {
        let def = this._def.find(def => def.name === flagName || def.short == flagName);
        if (def === undefined) {
            throw new Error(`Unknown option --${flagName}`);
        }
        return def;
    }
    
    private _setFlag(def: FlagDescriptor, value: string) {
        this._flags.push({
            def: def,
            value: value
        });
    }
}

export function createFlagSet(def: FlagDescriptor[], params?: string[]): FlagSet {
    return new _FlagSet(def, params);
}