const adb = require('adbkit');

import {OnDestroy, isPromiseLike} from '@jsmon/core';
import {Logger} from '@jsmon/platform';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {fromPromise} from 'rxjs/observable/fromPromise';
import {of} from 'rxjs/observable/of';
import {_throw} from 'rxjs/observable/throw';
import {map, flatMap, combineLatest} from 'rxjs/operators';

import {FireTVState} from './states';
import {KeyCodes} from './keycodes';
import {AppPackges, Intends} from './apps';
import {Tokenizer, Node} from './dumpsys';

export class FireTV implements OnDestroy {
    private _client: any;
    private _id: string|undefined = undefined;
    private _onConnected: Subject<void> = new Subject();
    
    get ready(): Observable<void> {
        return this._onConnected;
    }
    
    async onDestroy() {
        if (!!this._client) {
            try {
                let res = this._client.disconnect();
                
                if (isPromiseLike(res)) {
                    await res;
                }
            } catch(err) {

            }
        }
    }

    constructor(public readonly host: string, 
                public readonly port: number = 5555,
                private readonly _logger: Logger) {
        this._client = adb.createClient();
        
        const connect = () => {
            this._client.connect(this.host, this.port)
                .then((id: string) => {
                    this._id = id;
                    this._onConnected.next();
                })
                .catch((err: any) => {
                    this._logger.error(`Failed to connect to FireTV: ${err.toString()}`);
                    setTimeout(connect, 2000);
                });
        }
    }
    
    exec(cmd: string): Observable<Buffer> {
        if (this._id === undefined) {
            return _throw(new Error('not connected'));
        }
        
        return fromPromise(this._client.shell(this._id, cmd)
            .then(adb.util.readAll));
    }
    
    getPowerState(): Observable<FireTVState> {
        return this._dumpsys_get('power', '\'(Display Power|mWakefulness|Locks)\'')
            .pipe(
                combineLatest(this.currentApp(), this._dumpsys_parse('media_session')),
                map(([data, app, session]: [string, string|null, Node]) => {

                    let mediaSessions = session.findNodeRec('Sessions Stack');
                    
                    let lines =  data.split(/\r?\n/);
                    
                    let screenLine = lines.find(line => line.includes('Display Power'));
                    if (screenLine !== undefined && !screenLine.includes('state=ON')) {
                        return FireTVState.OFF;
                    }
                    
                    let awake = lines.find(line => line.includes('mWakefulness'));
                    if (awake !== undefined && !awake.includes('Awake')) {
                        return FireTVState.IDLE;
                    }
                    
                    if (app === AppPackges.LAUNCHER || app === AppPackges.SETTINGS) {
                        return FireTVState.STANDBY;
                    }
                    
                    if (mediaSessions !== undefined) {
                        let active = mediaSessions.leafs.find(l => {
                            return l.leafs.find(data => {
                                return data.line.includes('active=true');
                            }) !== undefined;
                        });
                        
                        if (active !== undefined) {
                            // find the line about the PlaybackState
                            let playbackState = active.leafs.find(l => l.line.includes('PlaybackState'));
                            
                            if (playbackState !== undefined) {
                                let line = playbackState.line;
                                let matches = line.match(/state=([0-9])+/im);

                                if (matches !== null && !!(matches[1])) {
                                    const state = matches[1];
                                    
                                    switch (Number(state)) {
                                        case 3:
                                            return FireTVState.PLAYING;
                                        default: // check for other definition
                                            return FireTVState.PAUSED;
                                    }
                                }
                            }
                        }
                    }
                    
                    return FireTVState.PAUSED;
                })
            );
    }
    
    isScreenOn(): Observable<boolean> {
        return this._dumpsys_includes('power', 'Display Power', 'state=ON');
    }

    isAwake(): Observable<boolean> {
        return this._dumpsys_includes('power', 'mWakefulness', 'Awake');
    }
    
    currentApp(): Observable<string|null> {
        return this._dumpsys_get('window windows', 'mCurrentFocus')
            .pipe(
                map(window => {
                    let re = new RegExp(/Window\{(?:[^\s]+) (?:[^\s]+) ([^\s]+)\/(?:[^\s]+)\}/im);
                    
                    const result = window.match(re);
                    
                    if (result === null) {
                        return null;
                    }
                    
                    return result[1];
                })
            );
    }
    
    turnOn(): Observable<void> {
        return this.getPowerState()
            .pipe(
                flatMap(state => {
                    if (state == FireTVState.OFF) {
                        return this._power();
                    }
                    
                    return of(undefined);
                }),
                map(() => undefined)
            )
    }
    
    turnOff(): Observable<void> {
        return this.getPowerState()
            .pipe(
                flatMap(state => {
                    if (state != FireTVState.OFF) {
                        return this._power();
                    }
                    
                    return of(undefined);
                }),
                map(() => undefined)
            )
    }

    getRunningApps(search: string = 'u0_a'): Observable<string[]> {
        return this.exec('ps')
            .pipe(
                map(data => data.toString()),
                map(data => data.split(/\r?\n/)),
                map(lines => {
                    return lines.filter(line => line.includes(search))
                        .map(line => {
                            return line.trim().split(' ').slice(-1)[0]
                        });
                })
            );
    }
    
    private _dumpsys(subsys: string): Observable<Buffer> {
        return this.exec(`dumpsys ${subsys}`);
    }

    private _dumpsys_parse(subsys: string): Observable<Node> {
        return this.exec(`dumpsys ${subsys}`)
            .pipe(
                map(data => {
                    return Tokenizer.parse(data.toString());
                })
            );
    }
    
    private _power(): Observable<void> {
        return this._key(KeyCodes.POWER)
            .pipe(map(() => undefined));
    }
    
    private _key(key: KeyCodes): Observable<Buffer> {
        return this._input(`keyevent ${key}`);
    }
    
    private _input(cmd: string): Observable<Buffer> {
        return this.exec(`input ${cmd}`);
    }

    private _dumpsys_get(subsys: string, identifier: string): Observable<string> {
        return this.exec(`dumpsys ${subsys} | grep -E ${identifier}`)
            .pipe(
                map(data => data.toString())
            );
    }
    
    private _dumpsys_includes(subsys: string, identifier: string, what: string): Observable<boolean> {
        return this._dumpsys_get(subsys, identifier)
            .pipe(
                map(data => data.includes(what))
            );
    }
}
