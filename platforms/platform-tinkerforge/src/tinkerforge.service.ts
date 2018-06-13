import {Injectable, OnDestroy} from '@jsmon/core';
import {Logger} from '@jsmon/platform';
import {Subject} from 'rxjs/Subject';

let tinkerforge = require('tinkerforge');

import {BrickDC} from 'tinkerforge';

export class TinkerforgeConfig {
    constructor(
        public readonly host: string = 'localhost',
        public readonly port: number = 4223,
    ) {}
}

export enum ConnectReason {
    Request = 'request',
    AutoReconnect = 'auto-reconnect',
}

export enum DisconnectReason {
    Request = 'request',
    Error = 'error',
    Shutdown = 'shutdown',
}

@Injectable()
export class TinkerforgeService implements OnDestroy {
    private _connection: any|null;
    private _connectionPromise: Promise<any>|null = null;
    private _resolver: Function|null = null;
    
    /**
     * Emits a DisconnectReason each time the connection is closed/lost
     */
    readonly onError: Subject<DisconnectReason> = new Subject();
    
    /**
     * Emits a ConnectReason each time the connection has been established
     */
    readonly onConnect: Subject<ConnectReason> = new Subject();
    
    /**
     * Returns the hostname/IP used to connect to brickd
     */
    get host(): string {
        return this._config.host;
    }
    
    /**
     * Returns the port used to connect to brickd
     */
    get port(): number {
        return this._config.port;
    }

    constructor(private _config: TinkerforgeConfig,
                private log: Logger) {
                
        this._connection = new tinkerforge.IPConnection();
        
        this.log = log.createChild(`Tinkerforge<${this._config.host}:${this._config.port}>`);
        
        this._connection.on(tinkerforge.IPConnection.CALLBACK_CONNECTED, (reason: number) => {
            switch(reason) {
            case tinkerforge.IPConnection.CONNECT_REASON_REQUEST:
                this.log.info(`Connection established`);
                this.onConnect.next(ConnectReason.Request);
                break;
            case tinkerforge.IPConnection.CONNECT_REASON_AUTO_RECONNECT:
                this.log.info(`Connection established (auto-reconnect)`) ;
                this.onConnect.next(ConnectReason.AutoReconnect);
                break;
            }
            
            if (!!this._resolver) {
                this._resolver();
                this._resolver = null;
            }
        });

        this._connection.on(tinkerforge.IPConnection.CALLBACK_DISCONNECTED, (reason: number) => {
            switch(reason) {
            case tinkerforge.IPConnection.DISCONNECT_REASON_REQUEST:
                this.log.info(`Connection closed (disconnect)`);
                this.onError.next(DisconnectReason.Request);
                break;
            case tinkerforge.IPConnection.DISCONNECT_REASON_ERROR:
                // un-resolvable problem
                this.log.warn(`Connection lost (error)`);
                this.onError.next(DisconnectReason.Error);
                break;
            case tinkerforge.IPConnection.DISCONNECT_REASON_SHUTDOWN:
                // disconnect initiate by brickd/WIFI extension
                this.log.warn(`Connection closed by peer`)
                this.onError.next(DisconnectReason.Shutdown);
                break;
            }
        });
    }
    
    /**
     * Try to connect to brickd and return a promise that is fullfilled upon
     * a successful connection attempt
     */
    getConnection(): Promise<any> {
        if (this._connectionPromise === null) {
            this._connectionPromise = new Promise((resolve, _) => {
                this._resolver = resolve;
                this._connect();
            });
        }
        
        return this._connectionPromise;
    }
    
    private _connect(attempt: number = 0) {
        this.log.debug(`Trying to connect (${attempt} attempt) ...`);
        
        this._connection.connect(this._config.host, this._config.port, (err: Error) => {
            // Failed to connect to brickd/WiFi extension
            this.log.error(`Failed to connect to brickd: ${err}`);
            
            setTimeout(() => this._connect(attempt++), 5000);
        });
    }

    /**
     * Close the IP connection on destroy
     * @internal
     */
    onDestroy() {

    }
}