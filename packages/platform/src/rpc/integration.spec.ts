import {Injector} from '@jsmon/core';
import {Client, RPCClient, ClientTransport} from './client';
import {RPCServer, Server, Handle, Headers, Context, GenericRPCServer} from './server';
import * as proto from '../proto';
import * as protobuf from 'protobufjs';
import {MqttService} from '../net/mqtt';
import {Logger, useLoggingAdapter, ConsoleAdapter} from '../log';
import {MqttRpcClientTransport, MqttRpcServerTransport, MQTT_RPC_SERVER_NAME, MQTT_RPC_SERVICE_NAME} from './transports/mqtt';
import {take} from 'rxjs/operators';
import {Observable} from 'rxjs/Observable';

const echoServerProto = `
syntax = "proto3";

message EchoRequest {
    string msg = 1;
}

message EchoResponse {
    string msg = 1;
}

service EchoService {
    rpc Echo(EchoRequest) returns (EchoResponse) {}
}
`;

interface EchoRequest {
    msg?: string;
}

interface EchoResponse {
    msg?: string;
}

interface EchoService {
    Echo(r: EchoRequest): Observable<EchoResponse>;
}


const root = protobuf.parse(echoServerProto).root.resolveAll();

const EchoRequest = root.lookupType('EchoRequest')!;
const EchoResponse = root.lookupType('EchoResponse');

@Server('EchoService')
class EchoServiceImpl {
    @Handle('Echo')
    async echo(ctx: Context, req: EchoRequest): Promise<EchoResponse> {
        const reqHeaders = ctx.getRequestHeaders();

        Object.keys(reqHeaders).forEach(key => {
            ctx.setHeader(key, reqHeaders[key]);
        });

        return EchoResponse.create({
            msg: req.msg,
        }) as any as EchoResponse&protobuf.Type;
    }
}

class IntegrationTransport implements  ClientTransport {
    constructor(private _server: RPCServer<EchoServiceImpl>) {}
    
    async send(method: string, payload: proto.google.protobuf.IAny, headers?: Headers) {
        method = method.split('.').slice(2).join('.');
        const res = await this._server.dispatchBlob(method, new Context(), payload.value!);
        return {
            headers: {},
            payload: {
                value: res,
            }
        };
    }
}

describe('RPC Integration', () => {
    let transport: IntegrationTransport;
    let client: Client<EchoService>;
    let server: RPCServer<EchoServiceImpl>;

    beforeEach(() => {
        server = new RPCServer(root.root, new EchoServiceImpl());
        transport = new IntegrationTransport(server);
        client = RPCClient.create<EchoService>(root.lookupService('EchoService'), transport);
    });

    it('should work', async () => {
        let res = await client.Echo({msg: 'foobar'}).toPromise();
        
        expect(res.body.msg).toBe('foobar');
    })
});


describe('MQTT Integration', () => {
    let injector: Injector;
    let client: Client<EchoService>;
    let server: GenericRPCServer<EchoServiceImpl>;

    beforeEach(() => {
        injector = new Injector([
            MqttService,
            Logger,
            useLoggingAdapter(new ConsoleAdapter()),
            MqttRpcServerTransport,
            MqttRpcClientTransport,
            {
                provide: MQTT_RPC_SERVER_NAME,
                useValue: "server",
            },
            {
                provide: MQTT_RPC_SERVICE_NAME,
                useValue: 'EchoService',
            }
        ]);
        
        let service: MqttService = injector.get(MqttService);
        let clientTransport: MqttRpcClientTransport = injector.get(MqttRpcClientTransport);
        let serverTransport: MqttRpcServerTransport = injector.get(MqttRpcServerTransport);
        
        client = RPCClient.create<EchoService>(root.lookupService('EchoService'), clientTransport);
        server = new GenericRPCServer(root.root, new EchoServiceImpl(), serverTransport);
    });
    
    it('should work', async () => {
        const res = await client.Echo({msg: 'foobar'}).toPromise();
        expect(res.body.msg).toBe('foobar');
    });

    afterEach(() => injector.dispose());
})