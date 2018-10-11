import {HttpClient} from './client';

describe('HttpClient', () => {
    let client: HttpClient;

    beforeEach(() => {
        client = new HttpClient();
    });

    it('should support a "get()" method', () => {
        client.get(`http://google.at`)
            .subscribe(res => console.log(res));
    })
});