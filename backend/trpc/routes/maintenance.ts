import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { mockUsers } from "./auth";

const mockMaintenanceLogs: Array<{
  id: string;
  asset_id: string;
  date: string;
  actor: string;
  operation_type: "MAINTENANCE" | "INSPECTION" | "REPARATION" | "MODIFICATION";
  description: string;
  parts_ref: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  status: "PLANIFIEE" | "EN_COURS" | "TERMINEE";
  created_at: string;
}> = [
  {
    id: "maint-1",
    asset_id: "asset-1",
    date: "2024-01-10",
    actor: "Jean Technicien",
    operation_type: "MAINTENANCE",
    description: "Vidange et remplacement des filtres",
    parts_ref: "FIL-HYD-001, FIL-AIR-002",
    assigned_to: "user-1",
    assigned_to_name: "Jean Technicien",
    status: "TERMINEE",
    created_at: "2024-01-10",
  },
  {
    id: "maint-2",
    asset_id: "asset-1",
    date: "2024-02-05",
    actor: "Jean Technicien",
    operation_type: "REPARATION",
    description: "Remplacement du flexible hydraulique endommagé",
    parts_ref: "FLEX-HYD-15MM",
    assigned_to: "user-1",
    assigned_to_name: "Jean Technicien",
    status: "TERMINEE",
    created_at: "2024-02-05",
  },
  {
    id: "maint-3",
    asset_id: "asset-2",
    date: "2024-01-25",
    actor: "Marie HSE",
    operation_type: "INSPECTION",
    description: "Inspection visuelle des câbles et poulies",
    parts_ref: null,
    assigned_to: null,
    assigned_to_name: null,
    status: "TERMINEE",
    created_at: "2024-01-25",
  },
];

export const maintenanceRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        assetId: z.string().optional(),
        operationType: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      let filtered = [...mockMaintenanceLogs];

      if (input?.assetId) {
        filtered = filtered.filter((m) => m.asset_id === input.assetId);
      }
      if (input?.operationType) {
        filtered = filtered.filter((m) => m.operation_type === input.operationType);
      }

      return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return mockMaintenanceLogs.find((m) => m.id === input.id) || null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        asset_id: z.string(),
        date: z.string(),
        actor: z.string(),
        operation_type: z.enum(["MAINTENANCE", "INSPECTION", "REPARATION", "MODIFICATION"]),
        description: z.string(),
        parts_ref: z.string().optional(),
        assigned_to: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const assignedUser = input.assigned_to
        ? mockUsers.find((u) => u.id === input.assigned_to)
        : null;

      const newLog = {
        id: `maint-${Date.now()}`,
        asset_id: input.asset_id,
        date: input.date,
        actor: input.actor,
        operation_type: input.operation_type,
        description: input.description,
        parts_ref: input.parts_ref || null,
        assigned_to: input.assigned_to || null,
        assigned_to_name: assignedUser?.name || null,
        status: "PLANIFIEE" as const,
        created_at: new Date().toISOString(),
      };
      mockMaintenanceLogs.push(newLog);
      return newLog;
    }),

  listByTechnician: publicProcedure
    .input(
      z.object({
        technicianId: z.string(),
        status: z.enum(["PLANIFIEE", "EN_COURS", "TERMINEE"]).optional(),
      })
    )
    .query(async ({ input }) => {
      let filtered = mockMaintenanceLogs.filter(
        (m) => m.assigned_to === input.technicianId
      );

      if (input.status) {
        filtered = filtered.filter((m) => m.status === input.status);
      }

      return filtered.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PLANIFIEE", "EN_COURS", "TERMINEE"]),
      })
    )
    .mutation(async ({ input }) => {
      const log = mockMaintenanceLogs.find((m) => m.id === input.id);
      if (!log) {
        throw new Error("Maintenance non trouvée");
      }
      log.status = input.status;
      return log;
    }),
});
