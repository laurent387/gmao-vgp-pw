import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

const mockUsers = [
  {
    id: "user-1",
    email: "technicien@inspectra.fr",
    password: "technicien123",
    name: "Jean Technicien",
    role: "TECHNICIAN" as const,
  },
  {
    id: "user-2",
    email: "hse@inspectra.fr",
    password: "hse123",
    name: "Marie HSE",
    role: "HSE_MANAGER" as const,
  },
  {
    id: "user-3",
    email: "admin@inspectra.fr",
    password: "admin123",
    name: "Admin Système",
    role: "ADMIN" as const,
  },
  {
    id: "user-4",
    email: "auditeur@inspectra.fr",
    password: "auditeur123",
    name: "Pierre Auditeur",
    role: "AUDITOR" as const,
  },
];

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const user = mockUsers.find(
        (u) => u.email === input.email && u.password === input.password
      );

      if (!user) {
        throw new Error("Identifiants incorrects");
      }

      const token = `mock-token-${user.id}-${Date.now()}`;

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

    const userId = ctx.token.split("-")[2];
    const user = mockUsers.find((u) => u.id === `user-${userId}`);

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
});
