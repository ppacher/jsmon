import {ExpressionParser, ExpressionParserConfig, AST, BinaryExpression, ParseFunction} from '../expression-parser';
import {ModelRegistry, ModelDefinition} from './model';
import { NumToken, StringToken, IdentifierToken } from 'src/lexer';

export type Partitial<T> = {
    [P in keyof T]?: T[P];
}

export interface OperatorOverwrite {
    [operator: string]: {
        precedence: number;
        fn: (a: any, b: any) => any
    };
}

export interface KeywordValueResolver {
    (this: ModelQueryLanguage<any>, object: any, expression: AST): any
}

export interface KeywordHandler {
    [keyword: string]: {
        type: string;
        parse: ParseFunction,
        resolve: KeywordValueResolver 
    }
}

export class ModelQueryLanguage<T> {
    private _model: ModelDefinition;

    constructor(modelName: string,
                private _registry: ModelRegistry,
                private _operators: OperatorOverwrite = {},
                private _keywords: KeywordHandler = {}) {
        this._model = this._registry.getModel(modelName)!;
        if (!this._model) {
            throw new Error(`Unknown model ${modelName}`);
        }
    }
    
    parse(input: string): AST {
        return ExpressionParser.parse(input, this._getParserOptions());
    }

    find(input: string, collection: T[]): Partitial<T[]> {
        const ast = this.parse(input);
        
        if (ast.type !== 'binary') {
            console.log(ast);
            throw new Error(`Expected a binary expression`);
        }
        
        return collection.filter(object => this._parseBinaryExpression(object, ast as BinaryExpression));
    }
    
    protected _parseBinaryExpression(object: T, expression: BinaryExpression): any {
        let leftValue = this.resolveValue(object, expression.left);
        let rightValue = this.resolveValue(object, expression.right);
        
        // Check if we have an operator override and use that if one is set
        const override = this._operators[expression.operator];
        if (!!override) {
            return override.fn(leftValue, rightValue);
        }
        
        switch (expression.operator) {
            case '+':
                return leftValue + rightValue;
            case '-':
                return leftValue - rightValue;
            case '*':
                return leftValue * rightValue;
            case '/':
                return leftValue / rightValue;
            case '%':
                return leftValue % rightValue;
            case '==':
                return leftValue === rightValue;
            case '&':
                return leftValue & rightValue;
            case '|':
                return leftValue | rightValue;
            case '>':
                return leftValue > rightValue;
            case '>=':
                return leftValue >= rightValue;
            case '<':
                return leftValue < rightValue;
            case '<=':
                return leftValue <= rightValue;
            case '!=':
                return leftValue !== rightValue;
            case '&&':
                return leftValue && rightValue;
            case '||':
                return leftValue || rightValue;
            default:
                throw new Error(`Operator ${expression.operator} not supported`);
        }
    }
    
    resolveValue(object: T, expression: AST): any {
        // check if we have a keyword resolver defined
        let keywordResolver = Object.keys(this._keywords)
                                    .find(keyword => {
                                        return this._keywords[keyword].type === expression.type;
                                    });

        if (!!keywordResolver) {
            return this._keywords[keywordResolver].resolve.bind(this)(object, expression);
        }

        switch (expression.type) {
            case 'num':
                return (expression as NumToken).value;
            case 'str':
                return (expression as StringToken).value;
            case 'ident':
                return this.getIdentityProperty(object, (expression as IdentifierToken).value)
            case 'binary':
                return this._parseBinaryExpression(object, expression as BinaryExpression);
            default:
                throw new Error(`Invalid expression type ${expression.type}`);
        }
    }
    
    getIdentityProperty(identity: T, identifier: string): any {
        const path = identifier.split('.');
        let value: any = identity;
        
        while(path.length > 0) {
            value = value[path[0]];
            path.splice(0, 1);
        }
        
        return value;
    }
    
    private _getParserOptions(): ExpressionParserConfig {
        let cfg = new ExpressionParserConfig();
        let self = this;
        
        Object.keys(this._operators)
            .forEach(op => {
                const precedence = this._operators[op].precedence;

                cfg.precedence[op] = precedence;
            });

        Object.keys(this._keywords)
            .forEach(keyword => {
                cfg.lexer.keywords.push(keyword);
                cfg.keywordParsers[keyword] = this._keywords[keyword].parse;
            });

        // setup the identifier validation
        cfg.validateIdentifier = function() {
            const identifier = this.input.peek()!.value as string;
            
            // split the identifier on "." to get a "json-path"
            const path = identifier.split('.');
            
            // check if there's a property on that path
            let model: any = self._model;
            while (path.length > 0) {
            
                const name = path[0];
                path.splice(0, 1);
                
                if (model.type === undefined && model.properties !== undefined) {
                    const property = model.properties[name];
                    if (property === undefined) {
                        return this.input.croak(`Invalid identifier: "${identifier}". Model ${model.name} does not have a property "${name}"`);
                    }
                    
                    // this is a ModelDefinition
                    model = self._registry.getModel(property) 
                } else {
                    break;
                }
            }
            
            if (path.length > 0) {
                this.input.croak(`Invalid identifier: "${identifier}"`);
            }
        }
        
        return cfg;
    }
}
