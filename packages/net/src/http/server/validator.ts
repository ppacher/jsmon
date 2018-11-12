import { Injectable, Optional, Logger, NoopLogAdapter } from "@jsmon/core";
import { Request, Response, Next } from 'restify';
import { BoundRequestSettings } from "./server-internals";
import { BadRequestError, InternalServerError } from "restify-errors";
import { ResolvedStringProperty, ResolvedNumberProperty, ResolvedBooleanProperty, ResolvedArrayProperty } from "./parameters";

@Injectable()
export class Validator {
    constructor(@Optional() private _log: Logger = new Logger(new NoopLogAdapter)) {
        this._log = this._log.createChild(`validator`);
    }
    
    validateRequest(route: BoundRequestSettings, req: Request, res: Response, next: Next) {
        try {
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
                
            return next();
        } catch (err) {
            this._log.info(`Received invalid request for route "${req.getRoute().method} - ${req.getRoute().path}: ${err.toString()}`);
            return next(err);
        }
    }
    
    validateString(name: string, def: ResolvedStringProperty, value: string) {
        if (!!def.regex && !def.regex.test(value)) {
            throw new BadRequestError(`Parameter "${name} does not match expression ${def.regex}. Got "${value}"`);
        }
        
        if (value.length === 0) {
            throw new BadRequestError(`Parameter "${name}" is required. Got "${value}"`);
        }
    }
    
    validateNumber(name: string, def: ResolvedNumberProperty, value: string) {
        let number = parseInt(value);

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
    
    validateBoolean(name: string, def: ResolvedBooleanProperty, value: string) {
        const trueValues = ['true', '1', 't'];
        const falseValues = ['false', '0', 'f'];

        if (!trueValues.includes(value) && !falseValues.includes(value)) {
            throw new BadRequestError(`Invalid value for boolean parameter "${name}". Got "${value}"`);
        }
    }
}