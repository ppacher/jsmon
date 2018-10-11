import {HttpHeaders} from './request';
export interface HttpResponse {
    statusCode: number;
    status: string;
    
    headers: HttpHeaders;

    contentLength?: number;
    body?: string;
}
