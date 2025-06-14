import { Context as KoaContext } from 'koa';
import jwt from 'jsonwebtoken';
import { User } from '../auth/user';
import { Context } from '../types/auth';
import { JWT_SECRET } from '../auth/auth';

export const createContext = async ({ ctx }: { ctx: KoaContext }): Promise<Context> => {
  const authHeader = ctx.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null };
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { _id: string };
    
    const user = await User.findById(decoded._id);
    
    if (!user) {
      return { user: null };
    }

    const now = new Date();
    const hoursSinceLastRefill = Math.floor((now.getTime() - user.lastTokenRefill.getTime()) / (60 * 60 * 1000));

    if (hoursSinceLastRefill > 0) {
      user.token = Math.min(10, user.token + hoursSinceLastRefill);
      user.lastTokenRefill = now;
      await user.save();
    }
    
    return { user };
  } catch (error) {
    return { user: null };
  }
};