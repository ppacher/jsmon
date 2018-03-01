import {App, bootstrapApp, Injector, Trigger, DeviceManager, DeviceManagerModule} from '@homebot/core';
import {HTTPServerPlugin, HTTPServer, DeviceHttpApiPlugin, DeviceHttpApi, DeviceHttpApiConfig} from 'homebot-httpserver';
import {MPDPlugin, MPDConfig, MPDDevice} from 'homebot-mpd';
import {SysInfoDevice} from 'homebot-sysinfo';
import {DarkSkyWeatherService, DarkSkyAPIConfig, DarkSkyWeatherDevice} from 'homebot-darksyknet';
import {UseGraphQLSchema, GraphQLHTTPEndpoint, GraphQLSchemaBuilder} from 'homebot-graphql';

import {MqttPlugin, MqttDeviceApiPlugin, MqttDeviceManagerProxyPlugin} from 'homebot-mqtt';

import {loadConfig, getWeatherConfig, getMPDConfig, Config} from './config';

import {Observable} from 'rxjs/Observable';
import {combineLatest, debounceTime} from 'rxjs/operators';

import 'rxjs/add/operator/distinctUntilChanged';

import * as minimist from 'minimist';

@App({
    plugins: [
        HTTPServerPlugin,
        DeviceManagerModule,
        MPDPlugin,
        DeviceHttpApiPlugin,
        MqttPlugin,
        MqttDeviceApiPlugin,
        MqttDeviceManagerProxyPlugin
    ],
})
export class ExampleApp {
    constructor(private _device: DeviceManager,
                private _server: HTTPServer,
                private _injector: Injector,
                private _httpAPI: DeviceHttpApi) {
            
        const config = this._getConfig();
        const weatherConfig = getWeatherConfig(config);
        const mpdConfig = getMPDConfig(config);
        
        this._server.listen(9080);
        
        this._device.setupDevice('sysinfo', SysInfoDevice);
        
        if (weatherConfig !== undefined) {
            this._device.setupDevice('weather', DarkSkyWeatherDevice, 'Current weather conditions', [
                DarkSkyWeatherService,
                DarkSkyAPIConfig.provide(weatherConfig),
            ]);
        }
        
        if (mpdConfig !== undefined) {
            // Create a new device for MPD that connects to 127.0.0.1:6600 (defaults of MPDConfig.new())
            // This will expose any sensors and commands under http://localhost:9080/devices/mpd:localhost/
            let controller = this._device.setupDevice('mpd:localhost', MPDDevice, 'description', MPDConfig.provide(mpdConfig));
            
            let combinedSensor = controller.instance.currentSongTitle
                                    .pipe(
                                        combineLatest(
                                            controller.instance.currentSongArtist,
                                            controller.instance.currentSongAlbum,
                                        ),
                                        debounceTime(100),
                                    );
            let songNotifier = new Trigger(combinedSensor, (current, last) => current.join(' - ') !== last.join(' - '), val => console.log(val.join(' - ')));
        } 

        this._setupGraphQL();
    }

    private _setupGraphQL(): void {
        const schema = `
            type Sensor {
                name: String!
                description: String
                device: Device!
                value: String
            }

            type Device {
                name: String!
                description: String
                sensors: [Sensor]
            }

            type Query {
                devices: [Device]
                sensors: [Sensor]
            }

            schema {
                query: Query
            }
        `;

        const resolvers = {
            Query: {
                devices: () => {
                    return this._device.getRegisteredDevices()
                        .map(d => ({
                            name: d.name, 
                            description: d.description,
                            sensors: d.getSensorSchemas().map(s => ({
                                name: s.name,
                                description: s.description,
                                device: d,
                                value: JSON.stringify(d.getSensorValue(s.name))
                            }))
                        }));
                },

                sensors: () => {
                    return this._device.getRegisteredDevices()
                        .map(d => {
                            return d.getSensorSchemas()
                                .map(schema => ({
                                    name: schema.name, 
                                    description: schema.description,
                                    value: JSON.stringify(d.getSensorValue(schema.name))
                                }))
                        })
                        .reduce((res, current) => {
                            return [...res, ...current];
                        }, []);
                }
            }
        };

        const child = new Injector(this._injector);
        child.provide(GraphQLSchemaBuilder);
        child.provide(UseGraphQLSchema(schema, resolvers));
        child.provide(GraphQLHTTPEndpoint);

        const endpoint = child.get(GraphQLHTTPEndpoint);
    }

    private _getConfig(): Config {
        let args = minimist(process.argv.slice(2));

        const config = loadConfig(args.config);
        return config;
    }
}

bootstrapApp(ExampleApp);