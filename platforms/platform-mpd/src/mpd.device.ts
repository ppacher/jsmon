import {Inject, OnDestroy} from '@jsmon/core';
import {Logger, Device, Command, Sensor, ParameterType} from '@jsmon/platform';
import {MPD_CONFIG, MPDConfig} from './config';

import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {map, tap, share, distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {interval} from 'rxjs/observable/interval';

import * as mpc from 'mpc-js';

function mapSubject<T, R>(b: BehaviorSubject<T>, fn: (val: T) => R): Observable<R> {
    return b.asObservable()
        .pipe(map(fn));
}

@Device({
   description: 'MPD server' 
})
export class MPDDevice implements OnDestroy {
    private _mpd: mpc.MPC;
    
    private readonly _currentSong = new BehaviorSubject<mpc.PlaylistItem|null>(null);
    private readonly _status = new BehaviorSubject<mpc.Status|null>(null);
    private readonly _destroyed: Subject<void> = new Subject();
    
    @Sensor('title', ParameterType.STRING, 'The title of the current song')
    get currentSongTitle() {
        return mapSubject(this._currentSong, song => song ? song.title : '');
    }
    
    @Sensor('artist', ParameterType.STRING, 'The artist of the current song')
    get currentSongArtist() {
        return mapSubject(this._currentSong, song => song ? song.artist : '');
    }
    
    @Sensor('album', ParameterType.STRING, 'The album of the current song')
    get currentSongAlbum() {
        return mapSubject(this._currentSong, song => song ? song.album : '');
    }
    
    @Sensor('duration', ParameterType.NUMBER, 'The duration of the current song')
    get currentDuration() {
        return mapSubject(this._currentSong, song => song ? song.duration : -1);
    }
    
    @Sensor('position', ParameterType.NUMBER, 'The position of the current song in the tracklist')
    get currentPosition() {
        return mapSubject(this._currentSong, song => song ? song.position : -1);
    }
    
    @Sensor('playing', ParameterType.BOOLEAN, 'Wether or not playback is active')
    get isPlaying() {
        return mapSubject(this._status, status => status ? status.state === 'play' : false);
    }
    
    @Sensor('elapsed', ParameterType.NUMBER, 'The time elapsed in the current song')
    get elapsed() {
        return this._status.asObservable()
            .pipe(
                map(status => status  ? status.elapsed : -1),
                map(val => isNaN(val) ? -1 : val),
                distinctUntilChanged()
            );
    }

    @Command({
        name: 'find',
        description: 'search for songs, artists and albums',
        parameters: {
            type: {
                types: [ParameterType.STRING],
                description: 'Type of MPD tag to search for',
                optional: false,
            },
            what: {
                types: [ParameterType.STRING],
                description: 'What to search for',
                optional: false,
            }
        }
    })
    find(params: Map<string, any>): Promise<mpc.Song[]> {
        if (this._mpd === undefined || !this._mpd.isReady) {
            return Promise.reject('Not connected');
        }

        return this._mpd.database.find([[params.get('type'), params.get('what')]]);
    }
    
    @Command({
        name: 'play',
        description: 'Start playback',
        parameters: {
            pos: {
                types: [ParameterType.NUMBER],
                optional: true,
                description: 'start playback at the given position',
            }
        }
    })
    play(p: Map<string, any>): Promise<void> { 
        if (this._mpd === undefined || !this._mpd.isReady) {
            return Promise.reject('Not connected');
        }

        return this._mpd.playback.play(p.get('pos'));
    }

    @Command('pause', 'Pause playback')
    pause(): Promise<void> { 
        if (this._mpd === undefined || !this._mpd.isReady) {
            return Promise.reject('Not connected');
        }

        return this._mpd.playback.pause(true);
    }
    
    @Command('resume', 'Resume playback')
    resume(): Promise<void> { 
        if (this._mpd === undefined || !this._mpd.isReady) {
            return Promise.reject('Not connected');
        }

        return this._mpd.playback.pause(false);
    }
    
    onDestroy() {
        if (!!this._mpd) {
            this._mpd.disconnect();
        }
        
        this._destroyed.next();
        this._destroyed.complete();
        
        this._currentSong.complete();
        this._status.complete();
    }
    
    constructor(@Inject(MPD_CONFIG) private _config: MPDConfig, private _log: Logger) {
        this._mpd = new mpc.MPC();
        
        this._mpd.on('changed', (subsystems: string[]) => {
            // According to the docs we'll get an array but
            // make sure we get it ...
            if (!Array.isArray(subsystems)) {
                subsystems = [subsystems];
            }
            
            this._handleSubSystemChange(subsystems);
        });
        
        const connect = () => {
            // Initiate connection
            this._mpd.connectTCP(this._config.address, this._config.port)
                .then(() => {
                    this._log.info('Successfully connected to MPD');
                })
                .catch(err => {
                    this._log.warn('Failed to connect to MPD: ', err.message || err);
                });
        };
        
        this._mpd.on('socket-error', () => {
            // TODO(ppacher): add logging
            try {
                this._mpd.disconnect();
            } catch(err) {

            }
            
            setTimeout(() => connect(), 1000);
        });
        
        this._mpd.on('socket-end', () => {
            // TODO(ppacher): add logging
            try {
                this._mpd.disconnect();
            } catch(err) {

            }
            
            setTimeout(() => connect(), 1000);
        });
        
        connect();

        interval(this._config.interval)
            .pipe(takeUntil(this._destroyed))
            .subscribe(() => {
                this._handlePlayerChange();
                this._updateStatus();
            });
    }
    
    private _handleSubSystemChange(subsystems: string[]): void {
        subsystems.forEach(sys => {
            switch(sys) {
                case 'player':
                    this._handlePlayerChange();
                    this._updateStatus();
                    return;
            }
        });
    }
    
    private _handlePlayerChange(): void {
        this._mpd.status.currentSong()
            .then(song => {
                this._currentSong.next(song);
            })
            .catch(() => {});
    }
    
    private _updateStatus(): void {
        this._mpd.status.status()
            .then(status => {
                this._status.next(status);
            })
            .catch(() => {});
    }
}
