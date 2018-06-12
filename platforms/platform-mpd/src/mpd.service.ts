import {Injectable, Inject} from '@jsmon/core';
import {MPDConfig, MPD_CONFIG} from './config';

import * as mpc from 'mpc-js';

@Injectable()
export class MPDClientService {
    private _connection: mpc.MPC = new mpc.MPC();
    
    constructor(@Inject(MPD_CONFIG) private _config: MPDConfig) {}

    connect(): Promise<mpc.MPC> {
        return this._connection.connectTCP(this._config.address, this._config.port)
            .then(() => this._connection);
    }
}


