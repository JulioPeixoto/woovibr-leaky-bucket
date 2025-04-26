import { gql } from 'apollo-server-koa';

export const typeDefs = gql`
  type User {
    _id: ID!
    username: String!
    email: String!
    token: Int!
    lastTokenRefill: String!
    balance: Float!
  }

  type AuthPayload {
    token: String!
    user: User
  }

  type PixKeyResult {
    key: String!
    owner: String!
    found: Boolean!
    userId: ID
  }

  type PixTransferResult {
    success: Boolean!
    message: String!
    amount: Float
    receiver: String
    newBalance: Float
  }

  type Query {
    me: User
    product: String
    protected: ProtectedData
    findPixKey(key: String!): PixKeyResult
  }

  type ProtectedData {
    message: String!
    user: String!
  }

  type Mutation {
    register(username: String!, password: String!, email: String!): AuthPayload
    login(username: String!, password: String!): AuthPayload
    transferPix(key: String!, amount: Float!): PixTransferResult
  }
`;
