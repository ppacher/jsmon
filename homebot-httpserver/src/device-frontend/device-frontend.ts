import {Injectable, DeviceManager, DeviceController} from '@homebot/core';
import {HTTPServer, RemoveRouteFn} from '../server';
import {DeviceHttpApiConfig} from './config';
import {Request, Response} from 'restify';

@Injectable()
export class DeviceHttpApi {
    private _dispose: RemoveRouteFn = () => {};

    constructor(private _server: HTTPServer,
                private _manager: DeviceManager,
                public readonly config: DeviceHttpApiConfig) {
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
            .subscribe(device => this._setupDeviceRoute(device));
    } 
    
    /**
     * Setup routes for a device (sensors, commands, ...)
     * 
     * @param d The device controller for which to setup routes
     */
    private _setupDeviceRoute(d: DeviceController): void {
        const url = this.config.getDeviceRoute!(d); 
        
        console.log(`setting up device ${d.name} on ${url}`);
    }

    /**
     * HTTP handler that returns all devices and their command/sensor definitions
     * 
     * @param req  Http Request
     * @param res  Http Response
     */
    private _getDevices(req: Request, res: Response): void {
        const response = this._manager.getRegisteredDevices()
            .map(device => ({
                name: device.name,
                description: device.description,
                state: device.healthy(),
                commands: device.commands.map(cmd => ({
                    name: cmd.name,
                })),
                sensors: device.getSensorSchemas().map(sensor => ({
                    name: sensor.name,
                    type: sensor.type,
                    description: sensor.description,
                }))
            }));
        
        res.send(response);
    }
}