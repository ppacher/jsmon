import { SchemaRegistry } from './registry';
import { Schema } from './schema';

const UserSchema: Schema = {
    apiVersion: 'v1',
    kind: 'User',
    specDefinition: {
        type: 'object',
        required: [
            'username'
        ],
        properties: {
            username: {
                type: 'string'
            }
        }
    }
}

describe('SchemaRegistry', () => {
    let registry: SchemaRegistry;
    
    beforeEach(() => {
        registry = new SchemaRegistry();
    });

    it('should allow registering new schemas', () => {
        registry.add({
            apiVersion: 'v1alpha',
            kind: 'Example',
            specDefinition: {
                type: 'object',
                properties: {}
            }
        });

        expect(registry.has('v1alpha', 'Example')).toBeTruthy();
        expect(registry.has('v1', 'Example')).toBeFalsy();
    });
    
    it('should throw if the schema is already registered', () => {
        let schema: Schema = {
            apiVersion: 'v1alpha',
            kind: 'Example',
            specDefinition: {
                type: 'object',
                properties: {}
            }
        };

        registry.add(schema);
        
        expect(() => registry.add(schema)).toThrow();
    });

    it('should be possible to delete registered schemas', () => {
        let schema: Schema = {
            apiVersion: 'v1alpha',
            kind: 'Example',
            specDefinition: {
                type: 'object',
                properties: {}
            }
        };

        registry.add(schema);

        expect(registry.has('v1alpha', 'Example')).toBeTruthy();
        expect(registry.delete(schema)).toBeTruthy();
        expect(registry.has('v1alpha', 'Example')).toBeFalsy();
    });

    it('should be possible to get the schema definition', () => {
        let schema: Schema = {
            apiVersion: 'v1alpha',
            kind: 'Example',
            specDefinition: {
                type: 'object',
                properties: {}
            }
        };

        registry.add(schema);
        
        expect(registry.get('v1alpha', 'Example')).toBeDefined();
        expect(registry.get('v2alpha', 'Example')).toBeNull();
    });

    it('should be possible to validate a resource', () => {
        let schema: Schema = {
            apiVersion: 'v1',
            kind: 'User',
            specDefinition: {
                type: 'object',
                required: [
                    'username'
                ],
                properties: {
                    username: {
                        type: 'string'
                    }
                }
            }
        };

        registry.add(schema);

        expect(registry.validateResource({} as any)).not.toBeNull();
        
        expect(registry.validateResource({
            apiVersion: 'v1'
        } as any)).not.toBeNull();
        
        expect(registry.validateResource({
            apiVersion: 'v1',
            kind: 'User'
        } as any)).not.toBeNull();
        
        expect(registry.validateResource({
            apiVersion: 'v1',
            kind: 'User',
            spec: {
                username: 'foobar'
            }
        } as any)).toBeNull();
    });
    
    describe('locking', () => {
        it('should lock the schema by schema ref', () => {
            registry.add(UserSchema);

            expect(registry.isLocked(UserSchema)).toBeFalsy();
            registry.lock(UserSchema)
            expect(registry.isLocked(UserSchema)).toBeTruthy();
        });
        
        it('should lock the schema by version and kind', () => {
            registry.add(UserSchema);

            expect(registry.isLocked('v1', 'User')).toBeFalsy();
            registry.lock('v1', 'User')
            expect(registry.isLocked('v1', 'User')).toBeTruthy();
        });

        it('should unlock the schema by schema ref', () => {
            registry.add(UserSchema);

            registry.lock('v1', 'User')
            registry.lock('v1', 'User')
            
            expect(registry.isLocked(UserSchema)).toBeTruthy();
            registry.unlock(UserSchema)
            expect(registry.isLocked('v1', 'User')).toBeTruthy();
            registry.unlock('v1', 'User')
            expect(registry.isLocked(UserSchema)).toBeFalsy();
        });
        
        it('should unlock the schema by version and kind', () => {
            registry.add(UserSchema);

            registry.lock('v1', 'User')
            registry.lock('v1', 'User')
            
            expect(registry.isLocked('v1', 'User')).toBeTruthy();
            registry.unlock('v1', 'User')
            expect(registry.isLocked('v1', 'User')).toBeTruthy();
            registry.unlock('v1', 'User')
            expect(registry.isLocked('v1', 'User')).toBeFalsy();
        });
    })
});