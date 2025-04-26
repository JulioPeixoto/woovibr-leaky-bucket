import { gql } from 'apollo-server-koa';

export const typeDefs = gql`
  type User {
    _id: ID!
    username: String!
    token: Int!
    lastTokenRefill: String!
  }

  type AuthPayload {
    token: String!
    user: User
  }

  type Query {
    me: User
    product: String
    protected: ProtectedData
  }

  type ProtectedData {
    message: String!
    user: String!
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload
    login(username: String!, password: String!): AuthPayload
  }
`;
