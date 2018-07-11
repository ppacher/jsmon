import {google, ProcedureCallRequest, ProcedureCallResponse} from '../../proto';
import {Observable} from 'rxjs/Observable';


/* Headers appended to request and response messages */
export interface Headers {
    [key: string]: string;
}

export interface Request {
    /* The name of the method to invoke */
    readonly method: string;
    
    /* The method parameter */
    readonly requestMessage: Readonly<google.protobuf.IAny>;
    
    /** Request headers */
    readonly headers: Readonly<Headers>;
    
    /* Sends the response to the client */
    resolve(response: google.protobuf.IAny, headers?: Headers): Promise<void>;
    
    /* Send an error message to the client */
    fail(errorMessage: string): Promise<void>;
}

export interface ServerChannel {
    onRequest: Observable<Request>
    
    readonly client: string;
}

export interface ServerTransport {
    onConnection: Observable<ServerChannel>
}

