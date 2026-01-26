import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { pgQuery } from "../db/postgres";

type UserRole = 'ADMIN' | 'HSE_MANAGER' | 'TECHNICIAN' | 'AUDITOR';

interface DbUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token_mock: string | null;
}

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  let user: DbUser | null = null;

  if (token) {
    try {
      const users = await pgQuery<DbUser>(
        "SELECT id, email, name, role, token_mock FROM users WHERE token_mock = $1",
        [token]
      );
      user = users[0] || null;
    } catch (e) {
      console.error("[CONTEXT] Error fetching user:", e);
    }
  }

  return {
    req: opts.req,
    token,
    user,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({ ctx: { ...ctx, token: ctx.token } });
});

export const mutationProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  if (ctx.user?.role === 'AUDITOR') {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Les auditeurs n'ont pas le droit de modifier les données",
    });
  }

  return next({ ctx: { ...ctx, token: ctx.token, user: ctx.user } });
});

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  if (!ctx.user || !['ADMIN', 'HSE_MANAGER'].includes(ctx.user.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Accès réservé aux administrateurs",
    });
  }

  return next({ ctx: { ...ctx, token: ctx.token, user: ctx.user } });
});
