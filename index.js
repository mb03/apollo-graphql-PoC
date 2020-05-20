const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLInt
} = require('graphql')

const express = require('express');
const {Server} = require('http');
const {SubscriptionServer} = require('subscriptions-transport-ws');
const {execute, subscribe} = require('graphql');
const GraphHTTP = require('express-graphql');

let counter = 0;
const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'query',
        fields: {
            data: {
                name: 'data',
                type: new GraphQLObjectType({
                    name: 'type',
                    fields: {
                        test: {type: GraphQLInt}
                    }
                }),
                resolve(_, {}) {
                    let retval=counter++;
                    return new Promise(res => setTimeout(() => res({test: retval}), 1000))
                },
            },
        }
    }),
});

const app = express();

app.use('/graphql', GraphHTTP({
    schema: schema,
    graphiql: true
}));

const server = new Server(app);

/** GraphQL Websocket definition **/
SubscriptionServer.create({
    schema,
    execute,
    subscribe,
}, {
    server: server,
    path: '/ws',
},);

const port = 7766
server.listen(port, () => {
    console.log('Server started here -> http://0.0.0.0:' + port);
});