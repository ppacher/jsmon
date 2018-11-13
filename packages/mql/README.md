# `@jsmon/mql`

This package provides a generic tokenizer/lexer and expression parser. In addition a model query language parser is available that allows searching through JSON documents.

## Usage

 - [ModelQueryLanguage](#modelquerylanguage)
 - [ExpressionParser](#expressionparser)
 - [Lexer](#lexer)
 - [AST](#ast)

### ModelQueryLanguage

In order to use the `ModelQueryLanguage` parser a model definition must be created first:

```typescript
// file: models.ts

import { ModelDefinition } from '@jsmon/mql';

export const PermissionModel: ModelDefinition = {
    name: 'Permission',
    properties: {
        read: {
            type: 'boolean',
        },
        write: {
            type: 'boolean',
        },
        delete: {
            type: 'boolean',
        }
    }
}

export const UserModel: ModelDefinition = {
    name: 'User',
    properties: {
        username: {
            type: 'string'
        },
        firstname: {
            type: 'string'
        },
        age: {
            type: 'number'
        },
        permissions: {
            ref: 'Permission'
        }
    }
}
```

You can now search through a collection of users by using the `ModelQueryLanguage` class.

```typescript
import { ModelRegistry, ModelQueryLanguage } from '@jsmon/mql';
import { UserModel, PermissionModel } from './models';

// Create a new model registry
const registry = new ModelRegistry();

// Register both models
registry.register(UserModel)
        .register(PermissionModel);

// Create a ModelQueryLanguage instance using the name of the UserModel
// and the registry
const parser = new ModelQueryLanguage('User', registry);

// The following array represents our collection of users
const users = [
    {
        username: 'bob',
        firstname: 'Bob',
        age: 20,
        permissions: {
            read: true,
            write: false,
            delete: false,
        }
    },
    {
        username: 'alice',
        firstname: 'Alice',
        age: 35,
        permissions: {
            read: true,
            write: true,
            delete: true,
        }
    }
];

let result = parser.find(`age >= 20 && permissions.write == true`, users);
// should return alice
expect(result.length).toBe(1);
expect(result[0].username).toBe('alice')
```

#### Custom operators

It is also possible to define custom operators and keyword. The following example defines a `is_admin` operator that checks if all permissions are available.

```typescript
import { PrecedenceLevel } from '@jsmon/mql';

// ... code from above

const parser = new ModelQueryLanguage('User', registry, {
    contains: {
        precedence: PrecedenceLevel.Compare,
        fn: function (left: any, right: any) {
                const expected = typeof left === 'boolean' ? left : right;
                const perm = typeof left === 'boolean' ? right : left;
                const isAdmin = perm.write && 
                                perm.read  &&
                                perm.delete;

                return isAdmin === expected;
        }
    }
});

const result = parser.find(`permissions is_admin true`, users);

expect(result.length).toBe(1);
expect(result[0].username).toBe('alice')

```

See the [test cases](./src/query-language/language.spec.ts) for more examples.

#### Custom keywords

In addition to custom operators, it is also possible to define custom keywords. Though, this is a bit more complex as we need to provide
a custom parser function as well as a value resolver. The parser function is used by the `ExpressionParser` when the keyword is encountered and
the resolver function is used by the `ModelQueryLanguage` class when it encounters a custom token.

The following example defines a custom keyword `strlen` that acts like a function:

```typescript
import { KeywordHandler } from '@jsmon/mql';

const strlen: KeywordHandler = {
    type: 'strlen-token',
    parse: function() {
        // `this` is bound the the {@link ExpressionParser} instance
        this.input.next();
        let args = this.delimited("(", ")", ",", this.parse_expression);
        if (args.length > 1) {
            this.input.croak(`Expected only one argument for strlen`);
        }
        
        return {
            type: 'strlen-token',
            value: args[0]
        }
    },
    resolve: function(object: any, expression: AST) {
        if (expression.type !== 'strlen-token') {
            throw new Error(`This shouldn't happen as we are only called for "strlen-token" tokens`);
        }
        
        // Resolve the token to it's value (this may be any supported token: str, num, binary, ... )
        // In the resolve function, `this` is bound to the {@link ModelQueryLanguage} instance
        const value = this.resolveValue(object, (expression as CustomToken).value);
        return value.length;
    }
};

const parser = new ModelQueryLanguage('User', registry, {}, {
    strlen: strlen
});
```

See the [test cases](./src/query-language/language.spec.ts) for more examples.


### ExpressionParser

The `ExpressionParser` class can be used to parse an input string into an **Abstract Sytax Tree** ([AST](#ast)).

```typescript
import { ExpressionParser } from '@jsmon/mql';

const ast = ExpressionParser.parse(`a + 1 > 3`);

expect(ast).toEqual({
    type: 'binary',
    operator: '>',
    left: {
        type: 'binary',
        operator: '+',
        left: {
            type: 'ident',
            value: 'a'
        },
        right: {
            type: 'num',
            value: 1
        }
    },
    right: {
        type: 'num',
        value: 3
    }
})
```

One can now built a custom executor (like the [ModelQueryLanguage](#modelquerylanguage)) on top of the sytax tree.

The `ExpressionParser` also accepts a config object as the second parameter to `parse()` which can configure custom keyword parser, operators and there precedence as well as additional configuration for the [Lexer](#lexer). See the [test cases](./src/expression-parser.spec.ts) for more examples.

A more complete example for parsing simple SQL queries can be found [here](./src/expression-parser.spec.ts#L243)

### Lexer

### AST