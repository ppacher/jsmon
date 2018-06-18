import {Injectable, OnDestroy, Type} from '@jsmon/core';
import {Logger, DeviceManager} from '@jsmon/platform';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {getClass, Base, DeviceUID, TinkerforgeConnection} from './devices';

import * as tinkerforge from 'tinkerforge';
import { Observable } from 'rxjs/Observable';

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

export enum EnumerationType {
    Available = 'available',
    Connected = 'connected',
    Disconnected = 'disconnected'
}

const EnumerationMapping: {[key: number]: EnumerationType} = {
    [tinkerforge.IPConnection.ENUMERATION_TYPE_AVAILABLE]: EnumerationType.Available,
    [tinkerforge.IPConnection.ENUMERATION_TYPE_CONNECTED]: EnumerationType.Connected,
    [tinkerforge.IPConnection.ENUMERATION_TYPE_DISCONNECTED]: EnumerationType.Disconnected
}

@Injectable()
export class TinkerforgeService implements OnDestroy, TinkerforgeConnection {
    private _connection: tinkerforge.IPConnection;
    private _connectionPromise: Promise<any>|null = null;
    private _resolver: Function|null = null;
    
    private readonly _uidStates: Map<string, BehaviorSubject<boolean>> = new Map();
    
    // used to avoid re-curring log-messages
    private _unsupportedUIDs: string[] = [];

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
     * Returns the underlying IPConnection object. Note that
     * it is not ensured that the connection has been already established
     * Use getConnection() Promise if you need to wait for the connection to become
     * active
     */
    get connection(): tinkerforge.IPConnection {
        return this._connection;
    }
    
    /**
     * Returns the port used to connect to brickd
     */
    get port(): number {
        return this._config.port;
    }

    constructor(private _config: TinkerforgeConfig,
                private log: Logger,
                private _deviceManager: DeviceManager) {
                
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
                this._resolver(this._connection);
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
        
        this._connection.on(tinkerforge.IPConnection.CALLBACK_ENUMERATE,
            (uid: string, _: number, position: number, hwVersion: [number, number, number], fwVersion: [number, number, number], devId: number, type: number) => {
                const cls = getClass(devId);
                const enumType = EnumerationMapping[type]; 

                if (cls !== undefined) {
                    this._handleDeviceDiscovery(cls, uid, enumType);
                } else {
                    // track unsupported UIDs to avoid recurring log messages
                    if (this._unsupportedUIDs.indexOf(uid) != -1) {
                        return;
                    }
                    this._unsupportedUIDs.push(uid);
                    
                    let typeCls = Object.keys(tinkerforge)
                        .map(key => (tinkerforge as any)[key])
                        .find(obj => obj.DEVICE_IDENTIFIER === devId);
                        
                    if (typeCls !== undefined) {
                        this.log.warn(`Discovered ${enumType} unsupported device identifier for ${typeCls.name}(id=${devId})`)
                    } else {
                        this.log.warn(`Discovered ${enumType} unknown device identifier ${devId}`);
                    }
                }
            }
        );
        
        // TODO(ppacher): remove me
        this.startEnumeration();
    }
    
    startEnumeration(): void {
        const enumerate = () => {
            this._connection.enumerate();
            setTimeout(() => enumerate(), 5000);
        };

        this.getConnection()
            .then(() => enumerate());
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
    
    private _handleDeviceDiscovery<T extends Base<any>>(cls: Type<T>, uid: string, enumType: EnumerationType) {
        
        let subject = this._uidStates.get(uid);
        if (subject === undefined) {
            this.log.info(`Discovered ${enumType} ${cls.name} with uid=${uid}`);
            
            let isOnline = enumType === EnumerationType.Available || enumType === EnumerationType.Connected;
            subject = new BehaviorSubject<boolean>(isOnline);

            this._uidStates.set(uid, subject);
            
            try {
                this._createDevice(cls, uid);
            } catch(err) {
                this.log.error(`Failed to create device for ${cls.name} and UID=${uid}: ${err.toString()}`);
                this.log.error(err.stack);
            }
        } else {
            switch(enumType) {
            case EnumerationType.Available:
            case EnumerationType.Connected:
                if (subject.getValue() === false) {
                    this.log.info(`${enumType} ${cls.name} with uid=${uid} new state is ${enumType}`);
                    subject.next(true);
                }                
                break;
            case EnumerationType.Disconnected:
                if (subject.getValue() === true) {
                    this.log.info(`${enumType} ${cls.name} with uid=${uid} new state is ${enumType}`);
                    subject.next(false);
                }
                break;
            }
        }
    }

    watchDeviceState(uid: string): Observable<boolean> {
        let state = this._uidStates.get(uid);
        
        if (!!state) {
            return state.asObservable();
        }
        
        throw new Error(`Unknown device UID ${uid}`);
    }

    private _createDevice<T extends Base<any>>(cls: Type<T>, uid: string): void {
        let ctrl = this._deviceManager.setupDevice(uid, cls, undefined, [
            {
                provide: DeviceUID,
                useValue: uid,
            },
            {
                provide: TinkerforgeConnection,
                useValue: this,
            }
        ]);
        
        this.log.info(`Creating device for ${cls.name} and uid ${uid}`);
    }
    
    private _connect(attempt: number = 0) {
        this.log.debug(`Trying to connect (${attempt} attempt) ...`);
        
        this._connection.connect(this._config.host, this._config.port, (err: number) => {
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