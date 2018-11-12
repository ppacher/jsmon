import { Injectable, Logger, NoopLogAdapter, Optional } from "@jsmon/core";
import { Next, Request, Response } from 'restify';
import { BadRequestError, InternalServerError } from "restify-errors";
import { DefinitionResolver } from "./parameter-internals";
import { isPropertyRef, ResolvedBooleanProperty, ResolvedNumberProperty, ResolvedObjectProperty, ResolvedProperty, ResolvedStringProperty, ResolvedArrayProperty } from "./parameters";
import { BoundRequestSettings } from "./server-internals";

@Injectable()
export class Validator {
    constructor(@Optional() private _log: Logger = new Logger(new NoopLogAdapter),
                @Optional() private _resolver: DefinitionResolver = DefinitionResolver.default) {
        this._log = this._log.createChild(`validator`);
    }
    
    validateRequest(route: BoundRequestSettings, req: Request, res: Response, next: Next) {
        try {
            this.validateParameters(route, req);
            
            this.validateBody(route, req);
                
            return next();
        } catch (err) {
            // Log internal server errors or any non-http-errors
            if (err.statusCode !== 400 || err.statusCode === undefined) {
                console.log(err);
            }
            
            this._log.info(`Received invalid request for route "${req.getRoute().method} - ${req.getRoute().path}: ${err.toString()}`);
            return next(err);
        }
    }
    
    validateParameters(route: BoundRequestSettings, req: Request) {
        const parameterNames = Object.keys(route.parameters);
        const availableParameters = Object.keys(req.params || {});

        if (parameterNames.length === 0 && availableParameters.length > 0) {
            throw new BadRequestError(`Route does not accept any parameters`);
        }
        
        const invalidParameters = availableParameters.filter(p => !parameterNames.includes(p));
        if (invalidParameters.length > 0) {
            throw new BadRequestError(`Unknown parameters ${invalidParameters.join(', ')}`);
        }
        
        const missingParameters = parameterNames.filter(p => !availableParameters.includes(p));
        if (missingParameters.length > 0) {
            throw new BadRequestError(`Parameters ${missingParameters.join(', ')} are required`);
        }
        
        parameterNames.forEach(name => {
            const paramValue = req.params[name];
            const paramDefintion = route.parameters[name];

            switch(paramDefintion.type) {
                case 'string':
                    this.validateString(name, paramDefintion, paramValue);
                    break;
                case 'number':
                    this.validateNumber(name, paramDefintion, paramValue);
                    break;
                case 'boolean':
                    this.validateBoolean(name, paramDefintion, paramValue);
                    break;
                default:
                    throw new InternalServerError(`Unexpected parameter type for "${name}"`) ;
            }
        });
    }
    
    validateBody(route: BoundRequestSettings, req: Request) {
        if (!route.body && !!req.body) {
            throw new BadRequestError(`Unexpected request body for route "${req.getRoute().method} ${req.getRoute().path}"`);
        }
        
        if (!!route.body && !req.body) {
            throw new BadRequestError(`Expected request body for route "${req.getRoute().method} ${req.getRoute().path}"`);
        }

        let type: ResolvedProperty|undefined;

        if (isPropertyRef(route.body)) {
            type = this._resolver.get(route.body);
        } else {
            type = route.body;
        }
        
        if (type === undefined) {
            this._log.error(`Failed to get body type for route "${req.getRoute().method} ${req.getRoute().path}"`)
        } else {
            switch(type.type) {
                case 'string':
                    this.validateString('body', type, req.body);
                    break;
                case 'number':
                    this.validateNumber('body', type, req.body);
                    break;
                case 'boolean':
                    this.validateBoolean('body', type, req.body);
                    break;
                case 'object':
                    this.validateObject('body', type, req.body);
                    break;
                case 'array':
                    this.validateArray('body', type, req.body);
                default:
                    throw new InternalServerError(`Request validation for body types object and array are not yet supported`);
            }
        }
    }

    validateObject(name: string, def: ResolvedObjectProperty, value: any) {
        if (typeof value !== 'object') {
            throw new BadRequestError(`Expected body to contain a ${def.name} model for ${name} but got "${typeof value}".`)
        }
        
        // ensure all required properties are available
        def.required.forEach(key => {
            if (value[key] === undefined) {
                throw new BadRequestError(`Required object property "${key}" is missing for model ${def.name}`);
            }
        });

        // check all property types
        Object.keys(def.properties)
            .forEach(key => {
                let propertyDef = def.properties[key];
                const propertyValue = value[key];
                
                // if there is not value available skip the check (for required parameters, there must be a value
                // which we ensured above)
                if (propertyValue === undefined) {
                    return;
                }
            
                if (isPropertyRef(propertyDef)) {
                    let resolvedDef = this._resolver.get(propertyDef);
                    if (!resolvedDef) {
                        throw new InternalServerError(`Something went wrong. Failed to find object definition for ${def.name}.${key}`);
                    }
                    
                    propertyDef = resolvedDef;
                }
                
                switch (propertyDef.type) {
                    case 'string':
                        this.validateString(`${def.name}.${key}`, propertyDef, propertyValue);
                        break;
                    case 'number':
                        this.validateNumber(`${def.name}.${key}`, propertyDef, propertyValue);
                        break;
                    case 'boolean':
                        this.validateBoolean(`${def.name}.${key}`, propertyDef, propertyValue);
                        break;
                    case 'object':
                        this.validateObject(`${def.name}.${key}`, propertyDef, propertyValue);
                        break;
                    case 'array':
                        this.validateArray(`${def.name}.${key}`, propertyDef, propertyValue);
                        break;
                }
            });
    }
    
    validateArray(name: string, def: ResolvedArrayProperty, value: any) {
        if (!Array.isArray(value)) {
            throw new BadRequestError(`Expected an array for ${name} but got ${typeof value}`);
        }
        
        let itemDef: ResolvedProperty;

        if (isPropertyRef(def.itemDefinition)) {
            let d = this._resolver.get(def.itemDefinition);
            if (!d) {
                throw new InternalServerError(`Something went wrong. Failed to finde definition for ${def.itemDefinition.ref}`);
            }
            itemDef = d;
        } else {
            itemDef = def.itemDefinition;
        }

        value.forEach((val, index) => {
            const n = `${name}[${index}]`;
            switch(itemDef.type) {
                case 'string':
                    return this.validateString(n, itemDef, val);
                case 'number':
                    return this.validateNumber(n, itemDef, val);
                case 'boolean':
                    return this.validateBoolean(n, itemDef, val);
                case 'array':
                    return this.validateArray(n, itemDef, val);
                case 'object':
                    return this.validateObject(n, itemDef, val);
            }
        });
    }
    
    validateString(name: string, def: ResolvedStringProperty, value: string) {
        if (!!def.regex && !def.regex.test(value)) {
            throw new BadRequestError(`Parameter "${name}" does not match expression ${def.regex}. Got "${value}"`);
        }
        
        if (value.length === 0) {
            throw new BadRequestError(`Parameter "${name}" is required. Got "${value}"`);
        }
    }
    
    validateNumber(name: string, def: ResolvedNumberProperty, value: string|number) {
        let number = parseInt(''+value);

        if (isNaN(number)) {
            throw new BadRequestError(`Parameter "${name}" should be a number. Got "${value}"`);
        }
        
        if (def.max !== undefined && number > def.max) {
            throw new BadRequestError(`Parameter "${name}" is out of bounds. Maximum allowed value is ${def.max}. Got "${value}"`);
        }
        
        if (def.min !== undefined && number < def.min) {
            throw new BadRequestError(`Parameter "${name}" is out of bounds. Minimum allowed value is ${def.min}. Got "${value}"`);
        }
    }
    
    validateBoolean(name: string, def: ResolvedBooleanProperty, value: string|boolean) {
        const trueValues = ['true', '1', 't', true];
        const falseValues = ['false', '0', 'f', false];

        if (!trueValues.includes(value) && !falseValues.includes(value)) {
            throw new BadRequestError(`Invalid value for boolean parameter "${name}". Got "${value}"`);
        }
    }
}