import {RPCClient, Client} from './client';
import {ClientTransport, TransportResponse} from './transport';
import {Headers} from '../server/transport';
import {google} from '../../proto'
import * as protobuf from 'protobufjs';
import * as g from '../../proto';

class DummyClientTransport implements ClientTransport {
    send(method: string, payload: google.protobuf.IAny, headers?: Headers): Promise<TransportResponse> {
        return Promise.resolve({
            headers: {},
            payload: {}
        });
    }
}

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
    Echo(r: EchoRequest): Promise<EchoResponse>;
}


const root = protobuf.parse(echoServerProto).root.resolveAll();


const EchoRequest = root.lookupType('EchoRequest')!;
const EchoResponse = root.lookupType('EchoResponse');

describe('RPCClient', () => {
    let transport: DummyClientTransport;
    let client: Client<EchoService>;
    
    beforeEach(() => {
        transport = new DummyClientTransport();
        client = RPCClient.create<EchoService>(root.lookupService('EchoService'), transport);
    });

    it('should be created', () => {
        expect(client).toBeDefined();
    });
    
    it('should find the correct method by reflection', () => {
        expect(typeof (client as any)['Echo']).toEqual('function');
        expect((client as any)['foobar']).toEqual(undefined);
    });
    
    it('should call the transport with correct arguments', async () => {
        jest.spyOn(transport, 'send')
            .mockImplementation(() => {
                return Promise.resolve({
                    headers: {},
                    payload: google.protobuf.Any.create({
                        type_url: EchoResponse.fullName,
                        value: EchoResponse.encode({msg: 'foo'}).finish(),
                    }),
                });
            });
            
        let res = await client.Echo({msg: 'foobar'});

        expect(res).toBeDefined();
        expect(res).not.toBeNull();
        
        expect(res.body.msg).toBe('foo');
    })
})