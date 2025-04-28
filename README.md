# Leaky Bucket API (GraphQL)

A rate limiting implementation using the Leaky Bucket algorithm in a GraphQL API. This project was developed as part of the Woovi challenge.

## Features

- User authentication with JWT
- Rate limiting using Leaky Bucket algorithm
- GraphQL API
- MongoDB integration
- Pix transfer simulation

## Technology Stack

- Node.js
- TypeScript
- Koa.js
- Apollo Server (GraphQL)
- MongoDB with Mongoose
- JWT for authentication
- Jest for testing

## Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## API Structure

The API uses GraphQL as its sole interface. All operations including authentication, queries, and PIX transfers are handled through GraphQL.

### Schema Overview

- **Queries**:
  - `me`: Get current user information
  - `findPixKey`: Find a user by PIX key (email)
  - `protected`: Test protected endpoint

- **Mutations**:
  - `register`: Create a new user
  - `login`: Authenticate user
  - `transferPix`: Transfer money to another user

## Rate Limiting with Leaky Bucket

The API implements rate limiting using the Leaky Bucket algorithm:

1. Each user starts with 10 tokens
2. Tokens refill at a rate of 1 per hour (max 10)
3. Each API operation consumes 1 token (except GET operations)
4. If a user has 0 tokens, they cannot perform operations until tokens refill

## Testing

We simulate requests validating token strategy with Jest to show that the leaky bucket works. The tests verify:

- Token consumption on API operations
- Token refill mechanics
- Rate limiting when tokens are depleted
- Authentication flow with JWT validation

This ensures the Leaky Bucket algorithm is properly implemented and works as expected.

## Design Decisions

- **Simplified Data Model**: To avoid multiple collections, we stored the user balance directly in the User model along with authentication data and token information
- **GraphQL Only**: We removed REST endpoints for a cleaner implementation
- **Token Consumption**: Failed operations also consume tokens to prevent brute force attacks
- **Authentication**: JWT tokens expire after 1 hour

## Examples

### Register a User

```graphql
mutation {
  register(
    username: "user1",
    password: "password123",
    email: "user1@example.com"
  ) {
    token
    user {
      _id
      username
      email
      balance
    }
  }
}
```

### Login

```graphql
mutation {
  login(username: "user1", password: "password123") {
    token
    user {
      _id
      username
      balance
    }
  }
}
```

### Transfer PIX

```graphql
mutation {
  transferPix(key: "user2@example.com", amount: 10.5) {
    success
    message
    amount
    receiver
    newBalance
  }
}
```

For protected operations, add the Authorization header with the JWT token:
```
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
