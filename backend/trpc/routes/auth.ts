import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { pgQuery } from "../../db/postgres";

interface DbUser {
  id: string;
  email: string;
  name: string;
  role: string;
  token_mock: string | null;
  created_at: string;
}

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[AUTH] Login attempt for:", input.email);
      
      const users = await pgQuery<DbUser>(
        "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
        [input.email]
      );

      const user = users[0];
      if (!user) {
        console.log("[AUTH] User not found:", input.email);
        throw new Error("Identifiants incorrects");
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
