import {ModelDefinition, ModelRegistry} from './model';
        
export const BookModel: ModelDefinition = {
    name: 'Book',
    properties: {
        name: {
            type: 'string'
        }
    }
}
        
export const UserModel: ModelDefinition = {
    name: 'User',
    description: 'The definition of the user model',
    properties: {
        username: {
            type: 'string'
        },
        firstname: {
            type: 'string'
        },
        permissions: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        books: {
            type: 'array',
            items: {
                ref: 'Book'
            }
        }
    }
};

describe('ModelRegistry', () => {
    let registry: ModelRegistry;

    beforeEach(() => {
        registry = new ModelRegistry();
    });

    it('should accept model definitions', () => {
        expect(() => registry.register(UserModel)).not.toThrow();
        expect(registry.getModel('User')).toBeDefined();
        expect(registry.getModel({ref: 'User'})).toBeDefined();
    });
    
    it('should throw if the model is already registered', () => {
        expect(() => registry.register(UserModel)).not.toThrow();
        expect(() => registry.register(UserModel)).toThrow();
    });
});