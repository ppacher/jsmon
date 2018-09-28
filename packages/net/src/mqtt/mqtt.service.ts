import {Injectable, Inject, Optional} from '@jsmon/core';
import {Logger, NoopLogAdapter} from '@jsmon/core/log';
import {Client, connect, IClientOptions} from 'mqtt';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';

export const MQTT_BROKER_URL = 'mqtt-broker-url';
export const MQTT_CLIENT_CONNECT = 'mqtt-client-connect';

export interface MqttConnectFn {
    (brokerUrl?: string, opts?: IClientOptions): Client;
}

export interface MessageHandler {
    (topic: string, b: Buffer): void;
}

export interface CommandHandler {
    (b: Buffer): Promise<Buffer>;
}

export interface ProcedureCall {
    body: string|Buffer;

    responseTopic: string;
}

@Injectable()
export class MqttService {
    private _client: Client;
    private _log: Logger; 
    private _connected: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private _topics: Map<string, number> = new Map();
    private _messageCallbacks: Set<MessageHandler> = new Set();
    
    get onConnect(): Observable<void> {
        return this._connected.asObservable()
            .pipe(filter(connected => !!connected), map(() => {}));
    }

    constructor(
        @Inject(MQTT_BROKER_URL) @Optional() private _url: string,
        @Optional() log: Logger = new Logger(new NoopLogAdapter),
        @Inject(MQTT_CLIENT_CONNECT) @Optional() connectClient: MqttConnectFn = connect
    ) {
        this._client = connectClient(this._url);
        
        this._log = log.createChild('mqtt');

        this._client.on('connect', () => {
            this._log.info(`successfully connected`);
            this._connected.next(true);
        });

        this._client.on('message', (topic, payload, packet) => {
            this._messageCallbacks.forEach(handler => {
                handler(topic, payload);
            });
        });
    }
    
    public publish(topic: string, payload: Buffer|string): void {
        this._client.publish(topic, payload);
    }
    
    public subscribe(topic: string): Observable<[string, Buffer]> {
        return new Observable(observer => {
            if (!this._topics.has(topic)) {
                this._client.subscribe(topic, (err, granted) => {
                    if (!!err) {
                        observer.error(err);
                    }
                });
            }
            this._topics.set(topic, (this._topics.get(topic) || 0) + 1);
            
            const handler = (t: string, b: Buffer) => {
                if (!MqttService.filterMatchesTopic(topic, t)) {
                    return;
                }
                observer.next([topic, b]);
            };

            this._messageCallbacks.add(handler);

            return () => {
                this._messageCallbacks.delete(handler);

                let count = this._topics.get(topic);

                if (count === undefined) {
                    // strange things happen
                    return;
                }
                
                count--;
                
                if (count === 0) {
                    this._topics.delete(topic);
                    this._client.unsubscribe(topic);                    
                } else {
                    this._topics.set(topic, count);
                    
                }
            };
        });
    }

    // Taken from github.com/sclausen/ngx-mqtt
    public static filterMatchesTopic(filter: string, topic: string): boolean {
        if (filter[0] === '#' && topic[0] === '$') {
            return false;
        }
        // Preparation: split and reverse on '/'. The JavaScript split function is sane.
        const fs = (filter || '').split('/').reverse();
        const ts = (topic || '').split('/').reverse();
        // This function is tail recursive and compares both arrays one element at a time.
        const match = (): boolean => {
            // Cutting of the last element of both the filter and the topic using pop().
            const f = fs.pop();
            const t = ts.pop();
            switch (f) {
            // In case the filter level is '#', this is a match no matter whether
            // the topic is undefined on this level or not ('#' matches parent element as well!).
            case '#': return true;
            // In case the filter level is '+', we shall dive into the recursion only if t is not undefined.
            case '+': return t ? match() : false;
            // In all other cases the filter level must match the topic level,
            // both must be defined and the filter tail must match the topic
            // tail (which is determined by the recursive call of match()).
            default: return f === t && (f === undefined ? true : match());
            }
        };
        return match();
    }

    private _generateUUID(): string {
        const part = () => Math.random()
            .toString(36)
            .substr(2, 15);

        return part() + part();
    }
}