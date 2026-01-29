import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { pgQuery } from "../../db/postgres";
import { hashPassword, verifyPassword } from "../../services/password";

interface DbUser {
  id: string;
  email: string;
  name: string;
  role: string;
  token_mock: string | null;
  password_hash?: string | null;
  must_change_password?: boolean | null;
  created_at: string;
}

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const raw = (input ?? {}) as any;
      const body = (ctx as any)?.rawJson ?? {};
      console.log("[AUTH] Raw login input:", raw);
      if (body && Object.keys(body).length > 0) {
        console.log("[AUTH] Raw request JSON:", body);
      }

      // Accept multiple shapes (plain, {json}, batched {0:{json}})
      const email =
        raw.email ??
        raw.json?.email ??
        raw[0]?.email ??
        raw[0]?.json?.email ??
        body?.email ??
        body?.json?.email ??
        body?.[0]?.email ??
        body?.[0]?.json?.email;
      const password =
        raw.password ??
        raw.json?.password ??
        raw[0]?.password ??
        raw[0]?.json?.password ??
        body?.password ??
        body?.json?.password ??
        body?.[0]?.password ??
        body?.[0]?.json?.password;
      if (!email || typeof email !== "string") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email requis" });
      }

      console.log("[AUTH] Login attempt for:", email);
      
      const users = await pgQuery<DbUser>(
        "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
        [email]
      );

      const user = users[0];
      if (!user) {
        console.log("[AUTH] User not found:", email);
        throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiants incorrects" });
      }

      if (user.password_hash) {
        if (!password || !verifyPassword(String(password), user.password_hash)) {
          console.log("[AUTH] Invalid password for:", email);
          throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiants incorrects" });
        }
      }

      const token = `token-${user.id}-${Date.now()}`;
      console.log("[AUTH] Login successful for:", user.email);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
        mustChangePassword: Boolean(user.must_change_password),
      };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.token) {
      return null;
    }

    const parts = ctx.token.split("-");
    if (parts.length < 2) {
      return null;
    }

    const userId = parts[1];
    const users = await pgQuery<DbUser>(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    const user = users[0];
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
      }

      const users = await pgQuery<DbUser>(
        "SELECT id, password_hash FROM users WHERE id = $1",
        [ctx.user.id]
      );
      const user = users[0];
      if (!user || !user.password_hash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Mot de passe actuel invalide" });
      }

      if (!verifyPassword(input.currentPassword, user.password_hash)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Mot de passe actuel invalide" });
      }

      const newHash = hashPassword(input.newPassword);
      await pgQuery(
        "UPDATE users SET password_hash = $1, must_change_password = FALSE, password_updated_at = NOW() WHERE id = $2",
        [newHash, ctx.user.id]
      );

      return { success: true };
    }),

  listTechnicians: publicProcedure.query(async () => {
    console.log("[AUTH] Fetching technicians from database");
    const users = await pgQuery<DbUser>(
      "SELECT * FROM users WHERE role IN ('TECHNICIAN', 'HSE_MANAGER', 'ADMIN') ORDER BY name"
    );
    console.log("[AUTH] Found technicians:", users.length);
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
  }),

  listUsers: publicProcedure.query(async () => {
    console.log("[AUTH] Fetching all users from database");
    const users = await pgQuery<DbUser>(
      "SELECT * FROM users ORDER BY name"
    );
    console.log("[AUTH] Found users:", users.length);
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
  }),
});
