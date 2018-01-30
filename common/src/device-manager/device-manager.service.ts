import {Injectable} from '@homebot/core';
import {HTTPServer} from '../http/server';

@Injectable()
export class DeviceManager {
    constructor(private _server: HTTPServer) {} 
}