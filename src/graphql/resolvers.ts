import bcrypt from 'bcrypt';
import { User } from '../auth/user';
import { generateToken } from '../auth/auth';

export const resolvers = {
  Query: {
    me: async (_: any, __: any, { user }: any) => {
      if (!user) return null;
      return user;
    },
    product: async (_: any, __: any, { user }: any) => {
      if (!user) throw new Error("Not authorized");
      return "Hello World!";
    },
    protected: async (_: any, __: any, { user }: any) => {
      if (!user) throw new Error("Not authorized");
      return { 
        message: "Access granted", 
        user: user.username 
      };
    }
  },
  Mutation: {
    register: async (_: any, { username, password }: any) => {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new Error("User already exists");
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        username,
        password: hashedPassword,
        token: 10,
        lastTokenRefill: new Date()
      });
      
      await user.save();
      const token = generateToken(user._id.toString());
      
      return { token, user };
    },
    login: async (_: any, { username, password }: any) => {
      const user = await User.findOne({ username });
      if (!user) {
        throw new Error("Invalid credentials");
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }
      
      const token = generateToken(user._id.toString());
      return { token, user };
    }
  }
};
