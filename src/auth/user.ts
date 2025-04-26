import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    token: { type: Number, default: 10 },
    lastTokenRefill: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", userSchema);
