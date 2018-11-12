interface BasePropertyDefinition {
    type: string;
    description?: string;
    displayName?: string;
    nullable?: boolean;
}

export interface StringPropertyDefinition extends BasePropertyDefinition {
    type: 'string';
}

export interface NumberPropertyDefinition extends BasePropertyDefinition {
    type: 'number';
}

export interface BooleanPropertyDefinition extends BasePropertyDefinition {
    type: 'boolean';
}

export interface ArrayPropertyDefinition extends BasePropertyDefinition {
    type: 'array';
    items: PropertyDefinition;
}

export interface ModelReference {
    ref: string;
}


export type PropertyDefinition = StringPropertyDefinition
                               | NumberPropertyDefinition
                               | BooleanPropertyDefinition
                               | ArrayPropertyDefinition
                               | ModelReference
                               | ModelDefinition;

export interface ModelDefinition {
    name: string;
    description?: string;
    displayName?: string;
    properties: {
        [key: string]: PropertyDefinition;
    }
}

export class ModelRegistry {
    private readonly _models: Map<string, ModelDefinition> = new Map();
    
    constructor() {}
    
    register(model: ModelDefinition): this {
        if (this._models.has(model.name)) {
            throw new Error(`Model definition already available`);
        }
        
        this._models.set(model.name, model);
        return this;
    }

    getModel(name: string | ModelReference | ModelDefinition): ModelDefinition | undefined {
        if (typeof name === 'object' && 'ref' in name) {
            return this._models.get(name.ref);
        }
        
        if (typeof name === 'object') {
            // It's already a model definition
            return name;
        }
        
        return this._models.get(name);
    }
}