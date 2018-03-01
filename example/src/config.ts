import {readFileSync} from 'fs';
import {resolve} from 'path';

import {DarkSkyAPIConfig, FieldSet, Units} from '@homebot/plugin-darkskynet';
import {MPDConfig} from '@homebot/plugin-mpd';
import * as firetv from '@homebot/plugin-firetv';

export interface WeatherConfig {
    apiKey: string;
    latitude: number;
    longitude: number;
    units: Units;
    language: string;
    excludes: FieldSet[];
}

export interface FireTVConfig {
    host: string;
}

export interface MusicConfig {
    address: string;
    port: number;
    username?: string;
    password?: string;
}

export interface Config {
    weather: WeatherConfig;
    mpd: MusicConfig;
    firetv: FireTVConfig;
}

export function loadConfig(path: string): Config {
    let blob = readFileSync(path);
    return JSON.parse(blob.toString());
}

export function getWeatherConfig(c: Config): DarkSkyAPIConfig {
    if (c.weather === undefined) {
        return undefined;
    }
    
    return new DarkSkyAPIConfig(
        c.weather.apiKey,
        {
            latitude: c.weather.latitude,
            longitude: c.weather.longitude
        }, 
        c.weather.units || 'si', 
        c.weather.language || 'de', 
        c.weather.excludes || ['minutely', 'daily', 'hourly']
    );
}

export function getMPDConfig(c: Config): MPDConfig {
    if (c.mpd === undefined) {
        return undefined;
    }
    
    return new MPDConfig(
        c.mpd.address || '127.0.0.1',
        c.mpd.port || 6600,
        c.mpd.username,
        c.mpd.password,
    );
}

export function getFireTVConfig(c: Config): firetv.FireTVConfig {
    return new firetv.FireTVConfig(c.firetv.host);
}