import mongoose from "mongoose";
import { IUser } from "../types/auth";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    token: { type: Number, default: 10 },
    lastTokenRefill: { type: Date, default: Date.now },
    balance: { type: Number, default: 100 }
});

export const User = mongoose.model<IUser>("User", userSchema);
