import {Provider, Inject, Injectable} from '@homebot/core';
import {makeExecutableSchema} from 'graphql-tools';
import {GraphQLSchema} from 'graphql';

export const GRAPHQL_SCHEMA = 'GRAPHQL_SCHEMA';

export function UseGraphQLSchema(schema: string, resolvers: any): Provider {
    return {
        provide: GRAPHQL_SCHEMA,
        useValue: [schema, resolvers],
    };
}

@Injectable()
export class GraphQLSchemaBuilder {
    public schema: GraphQLSchema;

    constructor(@Inject(GRAPHQL_SCHEMA) schema: [string, any]) {
        this.schema = makeExecutableSchema({
            typeDefs: schema[0],
            resolvers: schema[1],
        });
    }
}