import {Request, Headers, ServerChannel, ServerTransport} from '../transport';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {google} from '../../proto';

export class TestRequest implements Request {
    _resolved: google.protobuf.IAny|null = null;
    _failed: string|null = null;
    
    get resolved() { return this._resolved !== null; }
    get failed() { return this._failed !== null; }
    
    /* The name of the method to invoke */
    method: string;
    
    /* The method parameter */
    requestMessage: Readonly<google.protobuf.IAny>;
    
    /** Request headers */
    headers: Readonly<Headers>;
    
    /* Sends the response to the client */
    async resolve(response: google.protobuf.IAny, headers?: Headers): Promise<void> {
        console.log(`TestRequest: resolve`, response);
        this._resolved = response;
    }
    
    /* Send an error message to the client */
    async fail(errorMessage: string): Promise<void> {
        this._failed = errorMessage;
    }

    hasBeenResolved(response: google.protobuf.IAny): boolean {
        if (this._resolved === null) {
            return false;
        }
        
        return response.type_url === this._resolved.type_url && response.value.toString() === this._resolved.value.toString();
    }
    
    hasBeenFailed(msg?: string): boolean {
        if (msg === undefined) {
            return this._failed !== null;
        }
        
        let res = this._failed === msg;
        if (!res) {
            console.log(`Expected failure message to be "${msg}" but got "${this._failed}"`);
        }
        return res;
    }
}

export class TestChannel implements ServerChannel {
    public requests: Subject<Request> = new Subject();
    public client: string;
    
    public hasBeenSubscribed: boolean = false;
    public hasBeenUnsubscribed: boolean = false;

    get onRequest(): Observable<Request> {
        return new Observable(observer => {
            this.hasBeenSubscribed = true;
            let sub = this.requests.subscribe(res => observer.next(res), err => observer.error(err), () => observer.complete());

            return () => {
                this.hasBeenUnsubscribed = true;
                sub.unsubscribe();
            }
        })
    }

}

export class TestTransport implements ServerTransport {
    public connections: Subject<ServerChannel> = new Subject();
    
    public hasBeenSubscribed: boolean = false;
    public hasBeenUnsubcribed: boolean = false;

    get onConnection(): Observable<ServerChannel> {
        return new Observable(observer => {
            this.hasBeenSubscribed = true;
            let sub = this.connections.subscribe(res => observer.next(res), err => observer.error(err), () => observer.complete());

            return () => {
                this.hasBeenUnsubcribed = true;
                sub.unsubscribe();
            }
        });
    }
}