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
  try {
    console.log("[CTX] URL:", opts.req.url);
  } catch {}
  const authHeader = opts.req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  // Capture raw body for debugging/bypass when client envelopes differ
  let rawBody: string | null = null;
  let rawJson: any = null;
  try {
    const clone = opts.req.clone();
    rawBody = await clone.text();
    rawJson = rawBody ? JSON.parse(rawBody) : null;
    // Log for all admin mutations
    if (opts.req.url.includes("/api/trpc/admin.")) {
      console.log("[CTX] Admin mutation rawBody:", rawBody?.substring(0, 500));
    }
  } catch (e) {
    console.warn("[CONTEXT] Unable to read raw body", e);
  }

  let user: DbUser | null = null;

  if (token) {
    try {
      if (token.startsWith("token-")) {
        const parts = token.split("-");
        const userId = parts[1];
        if (userId) {
          const users = await pgQuery<DbUser>(
            "SELECT id, email, name, role, token_mock FROM users WHERE id = $1",
            [userId]
          );
          user = users[0] || null;
        }
      }

      if (!user) {
        const users = await pgQuery<DbUser>(
          "SELECT id, email, name, role, token_mock FROM users WHERE token_mock = $1",
          [token]
        );
        user = users[0] || null;
      }
    } catch (e) {
      console.error("[CONTEXT] Error fetching user:", e);
    }
  }

  return {
    req: opts.req,
    token,
    user,
    rawBody,
    rawJson,
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
  console.log("[ADMIN_PROC] token:", ctx.token?.substring(0, 30), "user:", ctx.user?.email, "role:", ctx.user?.role);
  
  if (!ctx.token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  if (!ctx.user || !['ADMIN', 'HSE_MANAGER'].includes(ctx.user.role)) {
    console.log("[ADMIN_PROC] Access denied - user role:", ctx.user?.role);
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Accès réservé aux administrateurs",
    });
  }

  return next({ ctx: { ...ctx, token: ctx.token, user: ctx.user } });
});
