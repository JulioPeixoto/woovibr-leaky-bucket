import bcrypt from 'bcrypt';
import { User } from '../auth/user';
import { generateToken } from '../auth/auth';
import { Context, IUser } from '../types/auth';
import { PixKeyResult, PixTransferResult } from '../types/pix';
import { FindPixKeyArgs, RegisterArgs, LoginArgs, TransferPixArgs, Resolver, ProtectedResult, AuthPayload } from '../types/resolvers';

export const resolvers = {
  Query: {
    me: (async (_parent: unknown, _args: Record<string, never>, { user }: Context) => {
      if (!user) return null;
      return user;
    }) as Resolver<IUser | null>,
    
    product: (async (_parent: unknown, _args: Record<string, never>, { user }: Context) => {
      if (!user) throw new Error("Not authorized");
      return "Hello World!";
    }) as Resolver<string>,
    
    protected: (async (_parent: unknown, _args: Record<string, never>, { user }: Context) => {
      if (!user) throw new Error("Not authorized");
      return { 
        message: "Access granted", 
        user: user.username 
      };
    }) as Resolver<ProtectedResult>,
    
    findPixKey: (async (_parent: unknown, { key }: FindPixKeyArgs, { user }: Context) => {
      if (!user) throw new Error("Not authorized");
      
      if (user.token <= 0) {
        throw new Error("Request limit exceeded, tokens: " + user.token);
      }
      
      user.token -= 1;
      await user.save();
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(key)) {
        throw new Error("Invalid email format");
      }
      
      const pixUser = await User.findOne({ email: key });
      
      if (pixUser) {
        return {
          key,
          found: true,
          owner: pixUser.username,
          userId: pixUser._id.toString()
        };
      } else {
        return {
          key,
          found: false,
          owner: "",
          userId: undefined
        };
      }
    }) as Resolver<PixKeyResult, FindPixKeyArgs>
  },
  
  Mutation: {
    register: (async (_parent: unknown, { username, password, email }: RegisterArgs) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
      }
      
      const existingUser = await User.findOne({ 
        $or: [
          { username },
          { email }
        ]
      });
      
      if (existingUser) {
        if (existingUser.username === username) {
          throw new Error("Username already exists");
        } else {
          throw new Error("Email already registered");
        }
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        username,
        password: hashedPassword,
        email,
        token: 10,
        lastTokenRefill: new Date(),
        balance: 100
      });
      
      await user.save();
      const token = generateToken(user._id.toString());
      
      return { token, user };
    }) as Resolver<AuthPayload, RegisterArgs>,
    
    login: (async (_parent: unknown, { username, password }: LoginArgs) => {
      const user = await User.findOne({ 
        $or: [
          { username },
          { email: username } 
        ]
      });
      
      if (!user) {
        throw new Error("Invalid credentials");
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }
      
      const token = generateToken(user._id.toString());
      return { token, user };
    }) as Resolver<AuthPayload, LoginArgs>,
    
    transferPix: (async (_parent: unknown, { key, amount }: TransferPixArgs, { user }: Context) => {
      if (!user) throw new Error("Not authorized");
      
      if (user.token <= 0) {
        throw new Error("Request limit exceeded, tokens: " + user.token);
      }
      
      try {
        if (amount <= 0) {
          throw new Error("Invalid amount: must be greater than zero");
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(key)) {
          throw new Error("Invalid email format");
        }
        
        if (user.balance < amount) {
          user.token -= 1;
          await user.save();
          
          return {
            success: false,
            message: "Insufficient funds",
          };
        }
        
        const receiverUser = await User.findOne({ email: key });
        
        if (!receiverUser) {
          user.token -= 1;
          await user.save();
          
          return {
            success: false,
            message: "Recipient not found: email is not registered",
          };
        }
        
        if (receiverUser._id.toString() === user._id.toString()) {
          user.token -= 1;
          await user.save();
          
          return {
            success: false,
            message: "Cannot transfer to yourself",
          };
        }
        
        user.balance -= amount;
        receiverUser.balance += amount;
        
        await user.save();
        await receiverUser.save();
        
        return {
          success: true,
          message: "Transfer completed successfully",
          amount,
          receiver: receiverUser.username,
          newBalance: user.balance
        };
      } catch (error: any) {
        user.token = Math.max(0, user.token - 1);
        await user.save();
        
        return {
          success: false,
          message: `Transfer failed: ${error.message || "Unknown error"}`,
        };
      }
    }) as Resolver<PixTransferResult, TransferPixArgs>
  }
};
