import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { ApolloServer } from 'apollo-server-koa';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { createContext } from './graphql/context';
import { connectDatabase } from './db';

const app = new Koa();
const port = 3333;

const startServer = async () => {
  await connectDatabase();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext,
    introspection: true,
  });

  await server.start();
  app.use(bodyParser());
  server.applyMiddleware({ app });

  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}/`);
    console.log(`🚀 GraphQL at http://localhost:${port}${server.graphqlPath}`);
  });
};

startServer();