import { Logger, NoopLogAdapter } from '@jsmon/core';
import { HttpClient } from './client';
import nock from 'nock';
import { RequestTimeoutError, HttpError } from 'restify-errors';

describe('HttpClient', () => {
    let http: nock.Scope;
    let client: HttpClient;

    beforeEach(() => {
        http = nock('https://example.com', {
            reqheaders: {
                'X-API-KEY': 'my-test-key'
            }
        });
        
        client = new HttpClient({
            baseURL: 'https://example.com',
            headers: {
                'X-API-KEY': 'my-test-key'
            }
        }, new Logger(new NoopLogAdapter));
    });

    describe(`Endpoint, parameters and headers`, () => {
        it('should use the correct endpoint', async () => {
            http.get('/foobar')
                .reply(200, 'success');

            let res = await client.get<string>('/foobar');

            expect(res).toBe('success');
            
            http.done();
        });
        
        it(`should correctly encode query parameter`, async () => {
            http.get('/query')
                .query({a: 2, b: 'test', v: 'foo'})
                .reply(204);
                
            http.get('/query')
                .query({a: [1, 2]})
                .reply(204);

            await client.get<void>('/query', {a: 2, b: 'test', v: 'foo'});
            await client.get<void>('/query', {a: [1, 2]});
            
            http.done();
        });
    });   
    
    describe('error handling', () => {
        it('should reject the promise for 4XX codes', async () => {
            http.get('/rejectme')
                .reply(401);

            const result = await client.get('/rejectme').catch(err => err);
            
            expect(result).toBeInstanceOf(Error);
            expect(result.statusCode).toBe(401);

            http.done();
        });
        
        it('should reject the promise for 5XX codes', async () => {
            http.get('/rejectme')
                .reply(504);

            const result = await client.get('/rejectme').catch(err => err);
            
            expect(result).toBeInstanceOf(Error);
            expect(result.statusCode).toBe(504);

            http.done();
        });

        it('should reject on timeout', async () => {
            client = new HttpClient({
                baseURL: 'https://example.com',
                headers: {
                    'X-API-KEY': 'my-test-key'
                },
                timeout: 10
            }, new Logger(new NoopLogAdapter))
            
            http.get('/test')
                .delay(20)
                .reply(200, 'success');

            const result = await client.get('/test').catch(err => err);
            
            expect(result).not.toBe('success');
            expect(result).toBeInstanceOf(Error);

            http.done();
        });
    });
    
    describe('methods', () => {
        describe('GET', () => {
            it('should support it without query parameters', async () => {
                http.get('/get')
                    .reply(204);

                await client.get<void>('/get');
                http.done();
            });
            
            it('should support it with query parameters', async () => {
                http.get('/get')
                    .query({foo: 'bar'})
                    .reply(204);
                    
                await client.get<void>('/get', {foo: 'bar'});
                http.done();
            });
        });
        
        function testWithBody(method: keyof HttpClient) {
            function getMethod(): Function {
                let fn = client[method].bind(client);
                return fn;
            }

            it('should support it without query params and without body', async () => {
                http[method as keyof nock.Scope].bind(http)
                    ('/request')
                    .reply(204);

                await getMethod()('/request');

                http.done();
            });
            
            it('should support it with query params and without a body', async () => {
                http[method as keyof nock.Scope].bind(http)
                    ('/request')
                    .query({foo: 'bar'})
                    .reply(204);

                await getMethod()('/request', {foo: 'bar'}, '');

                http.done();
            });

            if (method !== 'delete') {
                it('should support it without query params but with body', async () => {
                    http[method as keyof nock.Scope].bind(http)
                        ('/request', {foo: 'bar'})
                        .times(4)
                        .reply(204);
    
                    await getMethod()('/request', {foo: 'bar'});
                    await getMethod()('/request', null, {foo: 'bar'});
                    await getMethod()('/request', undefined, {foo: 'bar'});
                    await getMethod()('/request', '', {foo: 'bar'});
    
                    http.done();
                });
            }

            it('should support it with query params and with body', async () => {
                http[method as keyof nock.Scope].bind(http)
                    ('/request', {foo: 'bar'})
                    .query({bar: 'foo'})
                    .reply(204);
                    
                await getMethod()('/request', {bar: 'foo'}, {foo: 'bar'});
                
                http.done();
            });
        }
        
        describe('PUT', () => testWithBody('put'));
        describe('POST', () => testWithBody('post'));
        describe('DELETE', () => testWithBody('delete'));
    });
    
});