import Validator from './validator';
import { ObjectType, ListType } from './types';
import { Schema } from './schema';

describe('Validator', () => {
    describe('strings', () => {
        it('should check for a string', () => {
            expect(Validator.validateString(1, {type: 'string'})).not.toBe(null);
            expect(Validator.validateString('string', {type: 'string'})).toBeNull();
        })
    });
    
    describe('number', () => {
        it('should check for a number', () => {
            expect(Validator.validateNumber('1', {type: 'number'})).not.toBe(null);
            expect(Validator.validateNumber(1, {type: 'number'})).toBeNull();
        })
    });
    
    describe('boolean', () => {
        it('should check for a boolean', () => {
            expect(Validator.validateBoolean(1, {type: 'boolean'})).not.toBe(null);
            expect(Validator.validateBoolean(true, {type: 'boolean'})).toBeNull();
        })
    });
    
    describe('list', () => {
        it('should check for a list', () => {
            expect(Validator.validateList(1, {type: 'list', items: 'any'})).not.toBeNull();
            expect(Validator.validateList([], {type: 'list', items: 'any'})).toBeNull();
        });

        it('should validate list items', () => {
            const schema: ListType = {
                type: 'list',
                items: {
                    type: 'string'
                }
            };
           expect(Validator.validateList(['a', 'b', 'c'], schema)).toBeNull(); 
           expect(Validator.validateList(['a', 2, 'b'], schema)).not.toBeNull();
        })
    })
    
    describe('object', () => {
        it('should check for an object', () => {
            expect(Validator.validateObject('foo', {
                type: 'object',
                properties: {}
            })).not.toBeNull();

            expect(Validator.validateObject({}, {
                type: 'object',
                properties: {}
            })).toBeNull();
        });
        
        it('should check for missing required properties', () => {
            const schema: ObjectType = {
                type: 'object',
                required: ['foo'],
                properties: {
                    foo: {type: 'string'}
                }
            };

            expect(Validator.validateObject({}, schema)).not.toBeNull();
            expect(Validator.validateObject({foo: 'bar'}, schema)).toBeNull();
        });
        
        it('should check for unknown properties', () => {
            const schema: ObjectType = {
                type: 'object',
                properties: {
                    foo: {type: 'string'}
                }
            };

            expect(Validator.validateObject({}, schema)).toBeNull();
            expect(Validator.validateObject({bar: 'bar'}, schema)).not.toBeNull();
        });
        
        it('should check for property types', () => {
            const schema: ObjectType = {
                type: 'object',
                properties: {
                    string: {type: 'string'},
                    number: {type: 'number'}
                }
            };

            expect(Validator.validateObject({
                string: 'string',
                number: 0
            }, schema)).toBeNull();
            
            expect(Validator.validateObject({
                string: 10
            }, schema)).not.toBeNull();
        });
    });

    describe('Schema', () => {
        it('should validate complex types', () => {
            const s: Schema = {
                apiVersion: 'v1',
                kind: 'example',
                specDefinition: {
                    type: 'object',
                    required: [
                        'foo',
                        'bar'
                    ],
                    properties: {
                        foo: {
                            type: 'string'
                        },
                        bar: {
                            type: 'list',
                            items: {
                                type: 'boolean'
                            }
                        },
                        baz: 'any'
                    }
                }
            };

            expect(Validator.validate({
                apiVersion: 'foo',
            } as any, s)).not.toBeNull();
            
            expect(Validator.validate({
                apiVersion: 'v1',
                kind: 'bar'
            } as any, s)).not.toBeNull();
            
            expect(Validator.validate({
                apiVersion: 'v1',
                kind: 'example',
                spec: {
                    foo: 10,
                    bar: 'test'
                }
            }, s)).not.toBeNull();
            
            expect(Validator.validate({
                apiVersion: 'v1',
                kind: 'example',
                spec: {
                    foo: 'string',
                    bar: [
                        true, false, false, true
                    ],
                    baz: 'test'
                },
            }, s)).toBeNull();
        })
    })
});