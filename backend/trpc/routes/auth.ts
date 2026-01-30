import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { pgQuery } from "../../db/postgres";
import { hashPassword, verifyPassword } from "../../services/password";
import { sendEmail } from "../../services/email";

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

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
      }

      await pgQuery(
        "UPDATE users SET name = $1 WHERE id = $2",
        [input.name.trim(), ctx.user.id]
      );

      console.log("[AUTH] Profile updated for user:", ctx.user.id);
      return { success: true };
    }),

  requestPasswordReset: publicProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      // Handle wrapped input from web client
      const raw = (input ?? {}) as any;
      const body = (ctx as any)?.rawJson ?? {};
      const email =
        raw.email ??
        raw.json?.email ??
        body?.email ??
        body?.json?.email;

      if (!email || typeof email !== "string") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email requis" });
      }

      console.log("[AUTH] Password reset requested for:", email);

      const users = await pgQuery<DbUser>(
        "SELECT id, email, name FROM users WHERE LOWER(email) = LOWER($1)",
        [email]
      );

      const user = users[0];
      if (!user) {
        // Return success even if user not found (security best practice)
        console.log("[AUTH] User not found for password reset:", input.email);
        return { success: true };
      }

      // Generate secure token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in database
      await pgQuery(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3, created_at = NOW()`,
        [user.id, token, expiresAt]
      );

      // Generate reset link
      const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL?.replace("/api", "") || "https://api.in-spectra.com";
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      // Send email
      await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe - In-Spectra",
        text: `Bonjour ${user.name},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur le lien suivant pour définir un nouveau mot de passe :\n${resetLink}\n\nCe lien expire dans 1 heure.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\nCordialement,\nL'équipe In-Spectra`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3B82F6;">Réinitialisation de mot de passe</h2>
            <p>Bonjour <strong>${user.name}</strong>,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p style="margin: 20px 0;">
              <a href="${resetLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>
            <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">L'équipe In-Spectra</p>
          </div>
        `,
      });

      console.log("[AUTH] Password reset email sent to:", user.email);
      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      // Handle wrapped input from web client
      const raw = (input ?? {}) as any;
      const body = (ctx as any)?.rawJson ?? {};
      const token =
        raw.token ??
        raw.json?.token ??
        body?.token ??
        body?.json?.token;
      const newPassword =
        raw.newPassword ??
        raw.json?.newPassword ??
        body?.newPassword ??
        body?.json?.newPassword;

      if (!token || typeof token !== "string") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token requis" });
      }
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Mot de passe requis (min. 8 caractères)" });
      }

      console.log("[AUTH] Attempting password reset with token");

      // Find token and check expiration
      const tokens = await pgQuery<{ user_id: string; expires_at: string }>(
        "SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1",
        [token]
      );

      const tokenRecord = tokens[0];
      if (!tokenRecord) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Lien invalide ou expiré" });
      }

      if (new Date(tokenRecord.expires_at) < new Date()) {
        // Delete expired token
        await pgQuery("DELETE FROM password_reset_tokens WHERE token = $1", [token]);
        throw new TRPCError({ code: "BAD_REQUEST", message: "Lien expiré" });
      }

      // Update password
      const newHash = hashPassword(newPassword);
      await pgQuery(
        "UPDATE users SET password_hash = $1, must_change_password = FALSE, password_updated_at = NOW() WHERE id = $2",
        [newHash, tokenRecord.user_id]
      );

      // Delete used token
      await pgQuery("DELETE FROM password_reset_tokens WHERE user_id = $1", [tokenRecord.user_id]);

      console.log("[AUTH] Password reset successful for user:", tokenRecord.user_id);
      return { success: true };
    }),
});
