import { GraphQLServer, PubSub } from 'graphql-yoga';

// Messages in-memory
let messageId = 0;
const messages = [];

const typeDefs = `
  type Query {
    messages: [Message]!
  }

  type Mutation {
    addMessage(nickname: String!, message: String!): Message!
  }

  type Subscription {
    messageAdded: Message
  }

  type Message {
    id: ID!
    nickname: String!
    message: String!
  }
`;

const MESSAGE_ADDED = 'MESSAGE_ADDED';

const resolvers = {
  Query: {
    messages: (root, args, context, info) => {
      return messages;
    }
  },
  Mutation: {
    addMessage: (root, args, context, info) => {
      const { nickname, message } = args;
      const { pubsub } = context;
      const messageObject = { id: messageId, nickname, message };
      messageId++;
      messages.unshift(messageObject);
      pubsub.publish(MESSAGE_ADDED, {
        messageAdded: messageObject
      });
      return messageObject;
    }
  },
  Subscription: {
    messageAdded: {
      subscribe: (root, args, context, info) => {
        const { pubsub } = context;
        return pubsub.asyncIterator(MESSAGE_ADDED);
      }
    }
  }
};

const pubsub = new PubSub();
const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: { pubsub }
});

server.start({
  port: 4000,
  endpoint: '/graphql',
  subscriptions: '/graphql',
  playground: '/'
},() => {
  console.log('The server started on http://localhost:4000');
});