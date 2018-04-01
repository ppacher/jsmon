import {Injectable} from '@homebot/core';
import {GraphQLSchemaBuilder} from './schema';
import {HTTPServer} from '@homebot/plugin-httpserver';
import {graphiqlRestify, graphqlRestify} from 'apollo-server-restify';

@Injectable()
export class GraphQLHTTPEndpoint {
    constructor(
        private _server: HTTPServer,
        private _schemaBuilder: GraphQLSchemaBuilder,
    ) {
        const graphQLOptions = { schema: this._schemaBuilder.schema };
        
        this._server.server.get('/graphql', graphqlRestify(graphQLOptions));
        this._server.server.post('/graphql', graphqlRestify(graphQLOptions));
        
        this._server.server.get('/graphiql', graphiqlRestify({ endpointURL: '/graphql' }));
    }
}