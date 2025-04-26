import { Context, Next } from "koa";
import { User } from "./auth/user";

export const tokenBucketMiddleware = async (ctx: Context, next: Next) => {
    if (!ctx.state.user) {
        ctx.status = 401;
        ctx.body = { message: "Unauthorized" };
        return;
    }

    const user = await User.findById(ctx.state.user._id);

    if (!user) {
        ctx.status = 401;
        ctx.body = { message: "Unauthorized" };
        return;
    }

    const now = new Date();
    const hoursSinceLastRefill = Math.floor((now.getTime() - user.lastTokenRefill.getTime()) / (60 * 60 * 1000));

    if (hoursSinceLastRefill >= 0) {
        user.token = Math.min(10, user.token + hoursSinceLastRefill);
        user.lastTokenRefill = now;
        await user.save();
    }

    try {
        await next();
    } catch (error) {
        user.token -= 1;
        await user.save();
        throw error;
    }
}


