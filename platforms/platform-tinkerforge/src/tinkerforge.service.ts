import {Injectable, OnDestroy} from '@jsmon/core';
import {Logger} from '@jsmon/platform';

let tinkerforge = require('tinkerforge');

export class TinkerforgeConfig {
    constructor(
        public readonly host: string = 'localhost',
        public readonly port: number = 4223,
    ) {}
}

@Injectable()
export class TinkerforgeService implements OnDestroy {
    private _connection: any|null;

    constructor(private _config: TinkerforgeConfig,
                private log: Logger) {
        this._connection = new tinkerforge.IPConnection();
        
        this.log = log.createChild(`Tinkerforge<${this._config.host}:${this._config.port}>`);
        
        this._connection.on(tinkerforge.IPConnection.CALLBACK_CONNECTED, (reason: number) => {
            switch(reason) {
            case tinkerforge.IPConnection.CONNECT_REASON_REQUEST:
                this.log.info(`Connected`);
                break;
            case tinkerforge.IPConnection.CONNECT_REASON_AUTO_RECONNECT:
                this.log.info(`Auto-reconnect`) ;
                break;
            default:
                // TODO(ppacher): log unknown reason
                this.log.error(`Unsupported connect reason ${reason}`);
            }
        });

        this._connection.on(tinkerforge.IPConnection.CALLBACK_DISCONNECTED, (reason: number) => {
            switch(reason) {
            case tinkerforge.IPConnection.DISCONNECT_REASON_REQUEST:
                this.log.info(`Disconnected`);
                break;
            case tinkerforge.IPConnection.DISCONNECT_REASON_ERROR:
                // un-resolvable problem
                this.log.warn(`Disconnected due to an error`);
                break;
            case tinkerforge.IPConnection.DISCONNECT_REASON_SHUTDOWN:
                // disconnect initiate by brickd/WIFI extension
                this.log.warn(`Brick deamon closed the connection`)
                break;
            }
        })
        
        this._connection.connect(this._config.host, this._config.port, (err: Error) => {
            // Failed to connect to brickd/WiFi extension
            this.log.error(`Failed to connect to brickd: ${err.toString()}`);
        });
    }

    /**
     * Close the IP connection on destroy
     * @internal
     */
    onDestroy() {

    }
}