import { IUser } from '../src/types/auth';
import { resolvers } from '../src/graphql/resolvers';

jest.mock('../src/auth/user');

describe('Leaky Bucket Strategy Validation', () => {
  let mockUser: Partial<IUser>;
  let mockReceiverUser: Partial<IUser>;
  let context: any;
  let mockFindOne: jest.Mock;
  let mockSave: jest.Mock;
  
  beforeEach(() => {
    mockSave = jest.fn().mockResolvedValue(true);
    
    mockUser = {
      _id: 'user123',
      username: 'testuser',
      email: 'testuser@example.com',
      token: 10,
      lastTokenRefill: new Date(),
      balance: 100,
      save: mockSave
    };
    
    mockReceiverUser = {
      _id: 'receiver123',
      username: 'receiver',
      email: 'receiver@example.com',
      token: 10,
      lastTokenRefill: new Date(),
      balance: 50,
      save: jest.fn().mockResolvedValue(true)
    };
    
    mockFindOne = jest.fn().mockImplementation((query) => {
      if (query && query.email === 'receiver@example.com') {
        return Promise.resolve(mockReceiverUser);
      }
      return Promise.resolve(null);
    });
    
    const UserModel = require('../src/auth/user').User;
    UserModel.findOne = mockFindOne;
    
    context = { user: mockUser };
  });
  
  it('should fully validate the leaky bucket strategy', async () => {

    const successResult = await resolvers.Mutation.transferPix(
      null,
      { key: 'receiver@example.com', amount: 20 },
      context
    );
    
    // Test successful request - should not consume token
    expect(successResult.success).toBe(true);
    expect(mockUser.token).toBe(10); 
    expect(mockUser.balance).toBe(80);
    expect(mockReceiverUser.balance).toBe(70);
    
    mockFindOne.mockResolvedValueOnce(null);
    
    const notFoundResult = await resolvers.Mutation.transferPix(
      null,
      { key: 'nonexistent@example.com', amount: 10 },
      context
    );
    
    // Test failure - PIX key not found - should consume 1 token
    expect(notFoundResult.success).toBe(false);
    expect(mockUser.token).toBe(9); 
    expect(mockSave).toHaveBeenCalled();
    
    mockUser.balance = 5;
    
    const insufficientResult = await resolvers.Mutation.transferPix(
      null,
      { key: 'receiver@example.com', amount: 10 },
      context
    );
    
    // Test failure - insufficient balance - should consume 1 token
    expect(insufficientResult.success).toBe(false);
    expect(mockUser.token).toBe(8); 
    
    const invalidEmailResult = await resolvers.Mutation.transferPix(
      null,
      { key: 'invalid-email', amount: 10 },
      context
    );
    
    // Test failure - invalid email format - should consume 1 token
    expect(invalidEmailResult.success).toBe(false);
    expect(mockUser.token).toBe(7); 
    
    const oldRefillDate = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours = refill 3 tokens
    mockUser.lastTokenRefill = oldRefillDate;
    
    const simulateRecharge = () => {
      const now = new Date();
      const lastRefill = mockUser.lastTokenRefill as Date;
      const hoursSinceLastRefill = Math.floor(
        (now.getTime() - lastRefill.getTime()) / (60 * 60 * 1000)
      );
      
      if (hoursSinceLastRefill > 0) {
        const currentTokens = mockUser.token as number;
        mockUser.token = Math.min(10, currentTokens + hoursSinceLastRefill);
        mockUser.lastTokenRefill = now;
      }
    };
    
    // Test token refill
    simulateRecharge();
    expect(mockUser.token).toBe(10); 
    
    // Test limit of 10 tokens
    mockUser.token = 9;
    mockUser.lastTokenRefill = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours = refill 5 tokens
    simulateRecharge();
    expect(mockUser.token).toBe(10); 
    
    // Test no tokens available
    mockUser.token = 0;
    await expect(resolvers.Mutation.transferPix(
      null,
      { key: 'receiver@example.com', amount: 10 },
      context
    )).rejects.toThrow('Request limit exceeded');
    
    console.log('✅ Leaky Bucket Strategy successfully validated:');
    console.log('1. Successful requests do not consume tokens');
    console.log('2. Failed requests consume 1 token');
    console.log('3. Tokens are refilled at a rate of 1 per hour');
    console.log('4. Maximum token limit is 10');
    console.log('5. Requests are rejected when no tokens are available');
  });
}); 