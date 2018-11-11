import {Get, Use, Middleware, HttpServer} from '../src/http/server';
import {Request, Response, Next} from 'restify';
import {Injector, Injectable} from '@jsmon/core';

//
// Create a middleware class that restrict the value of a path parameter
//

interface RestrictParamConfig {
    name: string;
    value: string;
}

@Injectable()
export class RestrictParamMiddleware implements Middleware<RestrictParamConfig> {
    handle(options: RestrictParamConfig, req: Request, res: Response, next: Next) {
        if (req.params[options.name] !== options.value) {
            res.send(401, `Value ${req.params[options.name]} not allowed for parameter ${options.name}`);
            next(false);
            return;
        }
        
        next();
    }
}

//
// Wrap the @Use() decorator so it's easier to use
// we could also use @Use(RestringParamMiddleware, options) instead
// of @Restrict(options)
//

function Restrict(permission: RestrictParamConfig): any {
    return (...args: any[]) => {
        return Use(RestrictParamMiddleware, permission)(...args);
    }
}

//
// The actual class to provides routes
//

@Injectable()
class Foo {

    @Restrict({name: 'name', value: 'admin'})
    @Get('/hello/:name', {
        parameters: {
            name: {
                type: 'string',
                description: 'The name to return',
                regex: /.+/
            }
        }
    })
    hello(req: Request, res: Response, next: Next) {
        res.send('Hello ' + req.params.name);
        next();
    }

}


//
// Prepare the dependecy injector
//
const injector = new Injector([
    Foo,
    RestrictParamMiddleware,
    HttpServer,
]);

//
// Get the HttpServer from the dependecy injector
// we could also use new HttpServer() but this way the server
// cannot use dependecy injection so we would need to use @Use(new RestrictParamMiddleware())
// and srv.mount(new Foo())
//
const srv = injector.get<HttpServer>(HttpServer);

// Mount the class on the server
// without dependency injection we would need to use srv.mount(new Foo())
srv.mount(Foo);

// Start listening
srv.server.listen(8080);