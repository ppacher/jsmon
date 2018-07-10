import {Injectable, OnDestroy, Optional} from '@jsmon/core';
import {MqttService} from '../../net/mqtt';
import {Headers, Request, ServerChannel, ServerTransport} from '../transport';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {takeUntil} from 'rxjs/operators';
import {Logger, NoopLogAdapter} from '../../log';
import {ProcedureCallRequest, ProcedureCallResponse, google} from '../../proto';

/**
 * The topic used to listen for incoming RPC requests
 * `jsmon/rcp/{ServerName}/{ServiceName}`
 * 
 * The name of the method is encoded within the request body. See `ProcedureCallRequest` from 
 * {@link ../../../protobuf/rpc.proto}
 */
const RPCTopicListener = `jsmon/rpc/+/+`;

const ResponseTopicHeader = 'JSMON-MQTT-ReplyTo';

/**
 * @class MqttRpcServerTransport
 * 
 * @description
 * MqttRpcServerTransport is a ServerTransport implementation for @jsmon/platform/rpc that uses
 * an MQTT broker for communication
 */
@Injectable()
export class MqttRpcServerTransport implements ServerTransport, ServerChannel, OnDestroy {
    /**
     * For MQTT there is no explicit client ID
     */
    readonly client = "mqtt";
    
    private _destroyed: Subject<void> = new Subject();
    readonly onConnection: Observable<this>;
    private readonly _requests: Subject<Request> = new Subject();

    constructor(private _mqtt: MqttService,
                @Optional() private _log: Logger = new Logger(new NoopLogAdapter())) {
        
        this._log = this._log.createChild(`mqtt-rpc-transport`);

        this.onConnection = new Observable(observer => {
            observer.next(this);

            this._destroyed
                .subscribe(() => observer.complete());
                
            return () => {};
        });
        
        this._mqtt.subscribe(RPCTopicListener)
            .pipe(takeUntil(this._destroyed))
            .subscribe(request => this._handleRequest(request));
    }
    
    onDestroy() {
        this._destroyed.next();
        this._destroyed.complete();

        this._requests.complete();
    }
    
    get onRequest() {
        return this._requests.asObservable();
    }

    private _handleRequest([topic, payload]: [string, Buffer]): void {
        this._log.debug(`received RPC request on ${topic}`);
        try {
            const call = ProcedureCallRequest.decode(new Uint8Array(payload));
            
            // TODO(ppacher): check for existance of payload
            const request = new MqttRequest(call, this);
            
            this._requests.next(request);
        } catch (err) {
            console.log(`Cought error`, err);
            this._log.error(`Failed to serve request: ${err.toString()}`);
        }
    }

    async _resolve(request: ProcedureCallRequest, response: google.protobuf.IAny, headers: Headers) {
        const resp = this._prepareResponse(request, headers);
        resp.error = false;
        resp.payload = response;

        this._publishResponse(request, resp);
    }
    
    async _fail(request: ProcedureCallRequest, msg: string, headers: Headers) {
        const resp = this._prepareResponse(request, headers);
        resp.error = true,
        resp.errorMessage = msg;

        this._publishResponse(request, resp);
    }
    
    private _prepareResponse(request: ProcedureCallRequest, headers: Headers): ProcedureCallResponse {
        return new ProcedureCallResponse({
            clientId: request.clientId,
            requestId: request.requestId,
            headers: headers,
        });
    }
    
    private _publishResponse(request: ProcedureCallRequest, response: ProcedureCallResponse) {
        const topic = this._getResponseTopic(request);

        this._mqtt.publish(topic, new Buffer(ProcedureCallResponse.encode(response).finish()));
    }
    
    protected _getResponseTopic(request: ProcedureCallRequest): string {
        if (request.headers[ResponseTopicHeader] !== undefined) {
            return request.headers[ResponseTopicHeader];
        }
        
        return `jsmon/rpc-reply/${request.clientId}/${request.requestId}`;
    }
}

export class MqttRequest implements Request {
    constructor(
        private _request: ProcedureCallRequest,
        private _transport: MqttRpcServerTransport
    ) {}

    get method(): string {
        return this._request.method;
    }
    
    get headers(): Headers {
        return this._request.headers;
    }
    
    get requestMessage(): google.protobuf.IAny {
        return this._request.payload!;
    }

    resolve(payload: google.protobuf.IAny, headers: Headers) {
        return this._transport._resolve(this._request, payload, headers);     
    }
    
    fail(error: string) {
        return this._transport._fail(this._request, error, {});
    }
}