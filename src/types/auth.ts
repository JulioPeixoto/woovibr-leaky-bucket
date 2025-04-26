import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  username: string;
  password: string;
  email: string;
  token: number;
  lastTokenRefill: Date;
  balance: number;
}

export interface Context {
  user: IUser | null;
} 