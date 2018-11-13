import {UserModel} from './model.spec';
import {ModelQueryLanguage} from './language';
import {ModelRegistry} from './model';
import { AST, CustomToken, PrecedenceLevel } from '../expression-parser';

interface User {
    username: string;
    firstname: string;
    permissions: string[];
}

const users: User[] = [
    {
        username: 'bob',
        firstname: 'Bob',
        permissions: []
    },
    {
        username: 'alice',
        firstname: 'Alice',
        permissions: ['user:list']
    },
    {
        username: 'admin',
        firstname: 'Admin',
        permissions: ['user:list', 'user:create', 'user:delete']
    },
]

describe('ModelQueryLanguage', () => {
    let registry: ModelRegistry;
    let query: ModelQueryLanguage<User>;

    beforeEach(() => {
        registry = new ModelRegistry();
        registry.register(UserModel);

        query = new ModelQueryLanguage<User>('User', registry, {
            'contains': {
                precedence: PrecedenceLevel.Compare,
                fn: (left: any, right: any) => {
                    if (!Array.isArray(left)) {
                        throw new Error(`Expected left to be an array`);
                    }
                    return left.includes(right);
                }
            }
        }, {
            strlen: {
                type: 'strlen',
                parse: function() {
                    this.input.next();
                    let args = this.delimited("(", ")", ",", this.parse_expression);
                    if (args.length > 1) {
                        this.input.croak(`Expected only one argument for strlen`);
                    }
                    
                    return {
                        type: 'strlen',
                        value: args[0]
                    }
                },
                resolve: function(object: any, expression: AST) {
                    const value = this.resolveValue(object, (expression as any).value);
                    return value.length;
                }
            }
        });
    });

    it('should validate identifiers', () => {
        expect(() => query.parse('username')).not.toThrow();
        expect(() => query.parse('foobar')).toThrow();
    });

    it('should be able to return an identities property by path', () => {
        const user = users[0]; // Bob
        expect(query.getIdentityProperty(user, 'username')).toBe('bob');
    });

    describe('filtering', () => {
        it('should work for simple expressions', () => {
            const result = query.find('username == "bob"', users);
            expect(result.length).toBe(1);
            expect(result[0]).toEqual(users[0]);
        });       
        
        it('should work for ORed expressions', () => {
            const result = query.find('username == "bob" || username == "alice"', users);
            expect(result.length).toBe(2);
            expect(result[0]).toEqual(users[0]);
            expect(result[1]).toEqual(users[1]);
        });
        
        it('should work for ANDed expressions', () => {
            const result = query.find('username == "admin" && firstname == "Admin"', users);
            expect(result.length).toBe(1);
            expect(result[0]).toEqual(users[2]);
        });
        
        it('should work for complex expressions', () => {
            const result = query.find('username == ("a" + "dmin")', users);
            expect(result.length).toBe(1);
            expect(result[0]).toEqual(users[2]);
        });
        
        it('should support operator overloading', () => {
            const result = query.find('permissions contains "user:list"', users);
            expect(result.length).toBe(2);
            expect(result[0]!.username).toBe('alice');
            expect(result[1]!.username).toBe('admin');
        });

        it('should support the strlen function', () => {
            const result = query.find('strlen("foo") == 3', users);
            expect(result.length).toBe(3);
        })
    });
});