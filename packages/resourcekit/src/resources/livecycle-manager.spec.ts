import { LiveCycleManager } from './livecycle-manager';
import { Schema, Resource } from '../schema';

export const UserSchema: Schema = {
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

export interface User {
    username: string;
}

describe('LiveCycleManager', () => {
    let manager: LiveCycleManager;

    beforeEach(() => {
        manager = new LiveCycleManager();
        
        manager.schemas.add(UserSchema);
    });

    it('should create new instances for resources', () => {
        const user: Resource<User> = {
            apiVersion: 'v1',
            kind: 'User',
            spec: {
                username: 'admin'
            }
        };

        const id = manager.create(user);

        expect(id).toBeDefined();
        
        const instance = manager.getResourceById<User>(id);
        expect(instance).toBeDefined();
        expect(instance!.spec.username).toBe('admin');
    });

    it('should delete instances based on their ID', () => {
        const user: Resource<User> = {
            apiVersion: 'v1',
            kind: 'User',
            spec: {
                username: 'admin'
            }
        };

        const id = manager.create(user);
        expect(manager.getResourceById(id)).toBeDefined();
        
        manager.delete(id);
        expect(manager.getResourceById(id)).toBeUndefined();
    });

    it('should delete instances by instance reference', () => {
        const user: Resource<User> = {
            apiVersion: 'v1',
            kind: 'User',
            spec: {
                username: 'admin'
            }
        };

        const id = manager.create(user);
        const instance = {
            ...user,
            id
        };
        
        manager.delete(instance);
        expect(manager.getResourceById(id)).toBeUndefined();
    });

    it('should allow watching for created resources', () => {
        jest.useFakeTimers();

        const user: Resource<User> = {
            apiVersion: 'v1',
            kind: 'User',
            spec: {
                username: 'admin'
            }
        };

        const fn = jest.fn();

        manager.onResourceCreated.subscribe(fn);

        const id = manager.create(user);

        jest.runAllTimers();

        expect(fn).toHaveBeenCalled();
        expect(fn.mock.calls[0][0]).toBeDefined();
        expect(fn.mock.calls[0][0].id).toBe(id);

        jest.useRealTimers();
    });
    
    it('should allow watching for deleted resources', () => {
        jest.useFakeTimers();

        const user: Resource<User> = {
            apiVersion: 'v1',
            kind: 'User',
            spec: {
                username: 'admin'
            }
        };

        const fn = jest.fn();

        manager.onResourceDeleted.subscribe(fn);

        const id = manager.create(user);

        // run the notification times for resource-created
        jest.runAllTimers();
        
        manager.delete(id);
        jest.runAllTimers();

        expect(fn).toHaveBeenCalled();
        expect(fn.mock.calls[0][0]).toBeDefined();
        expect(fn.mock.calls[0][0].id).toBe(id);

        jest.useRealTimers();
    });
    
    it('should support finding resources', () => {
        const admin: Resource<User> = {
            apiVersion: 'v1',
            kind: 'User',
            spec: {
                username: 'admin'
            }
        };
        
        const user = {
            ...admin,
            spec: {
                username: 'user'
            } 
        };

        const adminID = manager.create(admin);
        manager.create(user);

        const empty = manager.filter({
            apiVersion: 'v1',
            kind: 'Permission',
            spec: {}
        });

        expect(empty.length).toBe(0);

        const users = manager.filter({
            apiVersion: 'v1',
            kind: 'User',
            spec: {}
        });

        expect(users.length).toBe(2);
        
        const adminResult = manager.findOne({
            apiVersion: 'v1',
            kind: 'User',
            spec: {
                username: 'admin'
            }
        });

        expect(adminResult).not.toBeNull();
        expect(adminResult!.id).toBe(adminID);
    });
});