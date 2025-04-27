import { Context, IUser } from "./auth";
import { GraphQLResolveInfo } from "graphql";

interface FindPixKeyArgs {
    key: string;
}

interface RegisterArgs {
    username: string;
    password: string;
    email: string;
}

interface LoginArgs {
    username: string;
    password: string;
}

interface TransferPixArgs {
    key: string;
    amount: number;
}

type Resolver<TResult, TArgs = Record<string, never>> =
    (parent: unknown, args: TArgs, context: Context, info: GraphQLResolveInfo) => Promise<TResult>;

interface ProtectedResult {
    message: string;
    user: string;
}

interface AuthPayload {
    token: string;
    user: IUser;
}

export { FindPixKeyArgs, RegisterArgs, LoginArgs, TransferPixArgs, Resolver, ProtectedResult, AuthPayload };
