import {Injectable, DeviceManager, DeviceController, SensorSchema, CommandSchema, ParameterDefinition, ParameterType, Optional} from '@homebot/core';
import {HTTPServer, RemoveRouteFn} from '../server';
import {DeviceHttpApiConfig} from './config';
import {Request, Response} from 'restify';
import {query} from 'jsonpath';

@Injectable()
export class DeviceHttpApi {
    private _dispose: RemoveRouteFn = () => {};
    private _devices: WeakMap<DeviceController, RemoveRouteFn> = new WeakMap();

    constructor(private _server: HTTPServer,
                private _manager: DeviceManager,
                @Optional() public readonly config: DeviceHttpApiConfig) {
                
        if (this.config === undefined) {
            this.config = new DeviceHttpApiConfig();
        }

        this._setupRoutes();
    }
    
    /**
     * Setup default routes on the Http server and register
     * for device registrations/unregistrations
     */
    private _setupRoutes(): void {
        this._dispose = this._server.register('get', this.config.BASE_URL, (req, res) => this._getDevices(req, res));

        // Whenever a new device is registered, setup the corresponding device
        // routes
        this._manager.registrations
            .subscribe((device: DeviceController<any>) => this._setupDeviceRoute(device));

        // Whenever a device is unregistered we need to remove all routes from the HTTP server
        this._manager.unregistrations
            .subscribe((device: DeviceController<any>) => {
                if (this._devices.has(device)) {
                    this._devices.get(device)!();
                }
            });
    } 
    
    /**
     * Setup routes for a device (sensors, commands, ...)
     * 
     * @param d The device controller for which to setup routes
     */
    private _setupDeviceRoute(d: DeviceController): void {
        const url = this.config.getDeviceRoute!(d); 
        const sensorsUrl = `${url}/sensors`;
        const cmdsUrl = `${url}/commands`;
        
        let cancelFns: RemoveRouteFn[] = [];

        cancelFns.push(this._server.register('get', url,
            (req, res) => this._getDevice(d, req, res)
        ));

        cancelFns.push(this._server.register('get', sensorsUrl, 
            (req, res) => this._getDeviceSensors(d, req, res)
        ));

        d.getSensorSchemas().forEach((sensor: SensorSchema) => {
            let sensorUrl = `${sensorsUrl}/${sensor.name}`;

            cancelFns.push(this._server.register('get', sensorUrl, 
                (req, res) => this._getDeviceSensor(d, sensor, req, res)
            ));
        });

        cancelFns.push(this._server.register('get', cmdsUrl, 
            (req, res) => this._getDeviceCommands(d, req, res)
        ));

        d.commands.forEach((cmd: CommandSchema) => {
            const cmdUrl = `${cmdsUrl}/${cmd.name}`;
            cancelFns.push(this._server.register('get', cmdUrl, 
                (req, res) => this._getDeviceCommand(d, cmd, req, res)
            ));

            cancelFns.push(this._server.register('post', cmdUrl, 
                (req, res) => this._callDeviceCommand(d, cmd, req, res)
            ));
        });
        
        this._devices.set(d, () => {
            cancelFns.forEach(dispose => dispose());
        });
    }

    private _getDevice(d: DeviceController, req: Request, res: Response): void {
        res.send(this._getDeviceDescriptor(d));
    }

    private _getDeviceSensors(d: DeviceController, req: Request, res: Response): void {
        const values = d.getSensorValues();
        const response = d.getSensorSchemas().map((sensor: SensorSchema) => ({
            ...sensor,
            value: values[sensor.name],
        }));
        res.send(response);
    }

    private _getDeviceSensor(d: DeviceController, s: SensorSchema, req: Request, res: Response): void {
        const value = d.getSensorValue(s.name);
        let response: any = {
            ...s,
            value: value,
        };
        
        let path = req.query['path'];
       
        try {
            response = this._pathSelect(response, path);
        } catch (err) {
            res.send(400, {error: err.toString()});
            return;
        }
        
        if (Array.isArray(response) || typeof response === 'object') {
            res.send(response);
            return;
        }

        res.sendRaw(''+response);
    }

    private _pathSelect(r: any, path?: string): any {
        let response: any = r;
        if (path !== undefined) {
            response = query(response, path);
            
            if (Array.isArray(response) && response.length === 1) {
                response = response[0];
            }
        }
        
        return response;
    }

    private _getDeviceCommands(d: DeviceController, req: Request, res: Response): void {
        const response = d.commands.map((cmd: CommandSchema) => this._getCommandDescriptor(cmd));
        
        res.send(response);
    }
    
    private _getDeviceCommand(d: DeviceController, cmd: CommandSchema, req: Request, res: Response): void {
        res.send(this._getCommandDescriptor(cmd));
    }
    
    private _callDeviceCommand(d: DeviceController, cmd: CommandSchema, req: Request, res: Response): void {
        let parameters: Map<string, any>;
        
        try {
            parameters = this._parseRequestParameters(cmd, req);
        } catch (err) {
            res.send(400, {'error': err.message});
            return;
        }

        d.call(cmd.name, parameters)
            .subscribe(
                (result: any) => {
                    let path = req.query['path'];
                    let response;
                    try {
                        response = this._pathSelect(result, path);
                    } catch (err) {
                        res.send(400, {error: err.toString()});
                        return;
                    }
                    
                    if (Array.isArray(response) || typeof response === 'object') {
                        res.send(response);
                        return;
                    }

                    res.sendRaw(''+response);
                },
                (err: any) => res.send({error: err}));
    }

    /**
     * HTTP handler that returns all devices and their command/sensor definitions
     * 
     * @param req  Http Request
     * @param res  Http Response
     */
    private _getDevices(req: Request, res: Response): void {
        const response = this._manager.getRegisteredDevices()
            .map((device: DeviceController) => this._getDeviceDescriptor(device));
        
        res.send(response);
    }

    private _getDeviceDescriptor(d: DeviceController): any {
        return {
            name: d.name,
            description: d.description,
            state: d.healthy(),
            commands: d.commands.map((cmd: CommandSchema) => ({
                name: cmd.name,
                description: cmd.description,
                // TODO: add parameters
            })),
            sensors: d.getSensorSchemas()
        };
    }
    
    private _parseRequestParameters(cmd: CommandSchema, req: Request): Map<string, any> {
        const params = new Map<string, any>();
        const isOptional = (p: ParameterType[]|ParameterDefinition) => {
            if (Array.isArray(p)) {
                return false;
            }
            
            return p.optional || false;
        };

        const hasParams = !!cmd.parameters && Object.keys(cmd.parameters).filter(key => !isOptional(cmd.parameters[key])).length > 0;
        const hasOptional = !!cmd.parameters && Object.keys(cmd.parameters).filter(key => isOptional(cmd.parameters[key])).length > 0;
        
        if (req.getContentType() !== 'application/json' && hasParams) {
            throw new Error(`Invalid content type. Accpected application json`);
        }
        
        if (!!req.body && !hasParams && !hasOptional) {
            throw new Error('Command does not accept parameters');
        }

        if (!hasParams && !hasOptional) {
            return params;
        }
        
        if ((req.body === undefined || req.body === '') && hasOptional && !hasParams) {
            return params;
        }

        if (typeof req.body !== 'object') {
            throw new Error(`Invalid request parameter type. Expected a JSON object but got ${typeof req.body}: params: ${hasParams}, optional: ${hasOptional}`);
        }
        
        Object.keys(req.body).forEach(key => {
            let value = req.body[key];

            params.set(key, value);
        });
        
        return params;
    }
    
    private _getCommandDescriptor(cmd: CommandSchema): any {

        return {
            name: cmd.name,
            description: cmd.description,
            parameters: Object.keys(cmd.parameters).map(key => {
                const def = cmd.parameters[key];
                return {
                    name: key,
                    types: Array.isArray(def) ? def : def.types,
                    optional: Array.isArray(def) ? false : def.optional,
                    help: Array.isArray(def) ? null : def.help
                };
            })
        };
    }
}