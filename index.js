const express = require('express');

const graphqlHTTP = require('express-graphql').graphqlHTTP;

const buildSchema = require('graphql').buildSchema;
const execute = require('graphql').execute;
const subscribe = require('graphql').subscribe;
const PubSub = require('graphql-subscriptions').PubSub;
const SubscriptionServer = require('subscriptions-transport-ws').SubscriptionServer;

const app = express();

// Create a schema and a root resolver:
const schema = buildSchema(`
    type Book {
        title: String!
        author: String!
    }

    type Query {
        books: [Book]
    }

    type Subscription { # New: subscribe to all the latest books!
        newBooks: Book!
    }
`);


const pubsub = new PubSub();
const rootValue = {
  books: [{
      title: "The Name of the Wind",
      author: "Patrick Rothfuss",
    },
    {
      title: "The Wise Man's Fear",
      author: "Patrick Rothfuss",
    }
  ],
  newBooks: () => pubsub.asyncIterator("BOOKS_TOPIC")
};

// Handle incoming HTTP requests as before:
app.use(graphqlHTTP({
  schema,
  rootValue
}));

// Start the server:
const server = app.listen(8080, () => console.log("Server started on port 8080"));

// Handle incoming websocket subscriptions too:
SubscriptionServer.create({
  schema,
  rootValue,
  execute,
  subscribe
}, {
  server // Listens for 'upgrade' websocket events on the raw server
});

// ...some time later, push updates to subscribers:
pubsub.publish("BOOKS_TOPIC", {
  title: 'The Doors of Stone',
  author: 'Patrick Rothfuss',
});

setInterval(function(){
  pubsub.publish("BOOKS_TOPIC", {
    title: 'The Doors of Stone',
    author: 'Patrick Rothfuss',
  });
},1000);



const GRAPHQL_ENDPOINT = 'ws://localhost:8080/graphql';

const client = new SubscriptionClient(GRAPHQL_ENDPOINT, {
  reconnect: true,
});
