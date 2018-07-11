import {Injectable, Optional, Inject} from '@jsmon/core';
import {ClientTransport, TransportResponse} from '../../client';
import {MqttService} from '../../../net/mqtt';
import {google, ProcedureCallRequest, ProcedureCallResponse} from '../../../proto';
import {Logger, NoopLogAdapter} from '../../../log';
import {Headers} from '../../server';
import {MQTT_RPC_SERVER_NAME, ResponseTopicHeader} from './common';

@Injectable()
export class MqttRpcClientTransport implements ClientTransport {
    private _requestId: number = 0;
    private _clientId: string = this._createClientID()

    constructor(private _mqtt: MqttService,
                @Optional() @Inject(MQTT_RPC_SERVER_NAME) private _serverName: string,
                @Optional() private _log: Logger = new Logger(new NoopLogAdapter())) {
        
        if (this._serverName === undefined) {
            throw new Error(`MqttRpcClientTransport: No MQTT_RPC_SERVER_NAME provided`);
        }
        
        this._log = this._log.createChild('mqtt-rpc-transport'); 
    }
    
    send(methodName: string, request: google.protobuf.IAny, headers?: Headers): Promise<TransportResponse> {
        return new Promise((resolve, reject) => {
            const requestID = this.nextRequestId;
            const replyTopic = this._getReplyTopic(requestID);
            const [_, serviceName, method] = methodName.split('.');
            
            const msg = ProcedureCallRequest.create({
                clientId: this._clientId,
                requestId: requestID,
                method: method,
                payload: request,
                headers: {
                    [ResponseTopicHeader]: replyTopic,
                }
            });
            
            this._mqtt.subscribe(replyTopic)
                .subscribe(([_, payload]: [string, Buffer]) => {
                    const response = ProcedureCallResponse.decode(payload);
                    if (response.error) {
                        reject(response.errorMessage);
                    } else {
                        resolve({
                            headers: response.headers,
                            payload: response.payload!,
                        });
                    }
                }, err => {
                    reject(err);
                });
            
            const payload = ProcedureCallRequest.encode(msg).finish();

            this._mqtt.publish(`jsmon/rpc/${this._serverName}/${serviceName}`, payload.toString());
        });
    }
    
    private get nextRequestId(): string {
        return ''+(this._requestId++);
    }
    
    private _getReplyTopic(requestId: string): string {
        return `jsmon/rpc-reply/${this._clientId}/${requestId}`;
    }

    private _createClientID() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 15; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
}