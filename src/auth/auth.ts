import { Context, Next } from "koa";
import jwt from "jsonwebtoken";
import { User } from "./user";
import bcrypt from "bcrypt";

const JWT_SECRET = "little_secret_do_sibelius"; 

export const generateToken = (userId: string): string => {
  return jwt.sign({ _id: userId }, JWT_SECRET, { expiresIn: "7d" });
};

export const authMiddleware = async (ctx: Context, next: Next) => {
  try {
    const authHeader = ctx.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.status = 401;
      ctx.body = { message: "Autorization token required" };
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { _id: string };
    
    const user = await User.findById(decoded._id);
    
    if (!user) {
      ctx.status = 401;
      ctx.body = { message: "User not found" };
      return;
    }
    
    ctx.state.user = user;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { message: "Invalid token" };
  }
};

export const register = async (ctx: Context) => {
  try {
    const { username, password } = ctx.body as any;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      ctx.status = 400;
      ctx.body = { message: "User already exists" };
      return;
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
    
    ctx.status = 201;
    ctx.body = { token };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: "Error registering user" };
  }
};

export const login = async (ctx: Context) => {
  try {
    const { username, password } = ctx.body as any;
    
    const user = await User.findOne({ username });
    if (!user) {
      ctx.status = 401;
      ctx.body = { message: "Invalid credentials" };
      return;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      ctx.status = 401;
      ctx.body = { message: "Invalid credentials" };
      return;
    }
    
    const token = generateToken(user._id.toString());
    
    ctx.status = 200;
    ctx.body = { token };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: "Error logging in" };
  }
};