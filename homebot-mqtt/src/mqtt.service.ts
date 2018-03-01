import {Injectable, Inject, Optional} from '@homebot/core';
import {Client, connect, Packet} from 'mqtt';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';

export const MQTT_BROKER_URL = 'mqtt-broker-url';

export interface MessageHandler {
    (topic: string, b: Buffer): void;
}

@Injectable()
export class MqttService {
    private _client: Client;
    
    private _connected: Subject<void> = new Subject();
    private _topics: Map<string, number> = new Map();
    private _messageCallbacks: Set<MessageHandler> = new Set();
    
    get onConnect(): Observable<void> {
        return this._connected.asObservable();
    }

    constructor(
        @Inject(MQTT_BROKER_URL) @Optional() private _url: string,
    ) {
        this._client = connect(this._url);

        this._client.on('connect', () => {
            this._connected.next();
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
}