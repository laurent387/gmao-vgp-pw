import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

const mockNCs: Array<{
  id: string;
  report_id: string | null;
  asset_id: string;
  checklist_item_id: string | null;
  title: string;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
  status: "OUVERTE" | "EN_COURS" | "CLOTUREE";
  created_at: string;
  asset_code?: string;
  asset_designation?: string;
}> = [
  {
    id: "nc-1",
    report_id: "report-2",
    asset_id: "asset-2",
    checklist_item_id: "item-5",
    title: "Système de freinage défaillant",
    description: "Le système de freinage présente une usure anormale. Remplacement nécessaire.",
    severity: 4,
    status: "OUVERTE",
    created_at: "2024-02-01",
    asset_code: "GRUE-001",
    asset_designation: "Grue à tour Liebherr",
  },
  {
    id: "nc-2",
    report_id: null,
    asset_id: "asset-1",
    checklist_item_id: null,
    title: "Fuite hydraulique",
    description: "Fuite constatée sur le circuit hydraulique principal.",
    severity: 3,
    status: "EN_COURS",
    created_at: "2024-01-20",
    asset_code: "CHAR-001",
    asset_designation: "Chariot élévateur Toyota",
  },
];

const mockActions: Array<{
  id: string;
  nonconformity_id: string;
  owner: string;
  due_at: string;
  status: "OUVERTE" | "EN_COURS" | "CLOTUREE" | "VALIDEE";
  closed_at: string | null;
  validated_by: string | null;
  description: string;
}> = [
  {
    id: "action-1",
    nonconformity_id: "nc-1",
    owner: "Jean Technicien",
    due_at: "2024-02-15",
    status: "OUVERTE",
    closed_at: null,
    validated_by: null,
    description: "Remplacer les plaquettes de frein et vérifier le système.",
  },
  {
    id: "action-2",
    nonconformity_id: "nc-2",
    owner: "Jean Technicien",
    due_at: "2024-02-10",
    status: "EN_COURS",
    closed_at: null,
    validated_by: null,
    description: "Identifier la source de la fuite et procéder à la réparation.",
  },
];

export const ncRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        assetId: z.string().optional(),
        severity: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      let filtered = [...mockNCs];

      if (input?.status) {
        filtered = filtered.filter((nc) => nc.status === input.status);
      }
      if (input?.assetId) {
        filtered = filtered.filter((nc) => nc.asset_id === input.assetId);
      }
      if (input?.severity) {
        filtered = filtered.filter((nc) => nc.severity >= input.severity!);
      }

      return filtered;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const nc = mockNCs.find((nc) => nc.id === input.id);
      if (!nc) return null;

      const action = mockActions.find((a) => a.nonconformity_id === nc.id);
      return { ...nc, corrective_action: action || null };
    }),

  create: protectedProcedure
    .input(
      z.object({
        report_id: z.string().optional(),
        asset_id: z.string(),
        checklist_item_id: z.string().optional(),
        title: z.string().min(1),
        description: z.string(),
        severity: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ input }) => {
      const newNC = {
        id: `nc-${Date.now()}`,
        report_id: input.report_id || null,
        asset_id: input.asset_id,
        checklist_item_id: input.checklist_item_id || null,
        title: input.title,
        description: input.description,
        severity: input.severity as 1 | 2 | 3 | 4 | 5,
        status: "OUVERTE" as const,
        created_at: new Date().toISOString(),
      };
      mockNCs.push(newNC);
      return newNC;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["OUVERTE", "EN_COURS", "CLOTUREE"]),
      })
    )
    .mutation(async ({ input }) => {
      const index = mockNCs.findIndex((nc) => nc.id === input.id);
      if (index === -1) {
        throw new Error("Non-conformity not found");
      }
      mockNCs[index].status = input.status;
      return mockNCs[index];
    }),

  actions: publicProcedure
    .input(z.object({ ncId: z.string() }))
    .query(async ({ input }) => {
      return mockActions.filter((a) => a.nonconformity_id === input.ncId);
    }),

  createAction: protectedProcedure
    .input(
      z.object({
        nonconformity_id: z.string(),
        owner: z.string(),
        due_at: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const newAction = {
        id: `action-${Date.now()}`,
        nonconformity_id: input.nonconformity_id,
        owner: input.owner,
        due_at: input.due_at,
        status: "OUVERTE" as const,
        closed_at: null,
        validated_by: null,
        description: input.description,
      };
      mockActions.push(newAction);
      return newAction;
    }),

  updateActionStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["OUVERTE", "EN_COURS", "CLOTUREE", "VALIDEE"]),
        validatedBy: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const index = mockActions.findIndex((a) => a.id === input.id);
      if (index === -1) {
        throw new Error("Action not found");
      }
      mockActions[index].status = input.status;
      if (input.status === "CLOTUREE") {
        mockActions[index].closed_at = new Date().toISOString();
      }
      if (input.status === "VALIDEE" && input.validatedBy) {
        mockActions[index].validated_by = input.validatedBy;
      }
      return mockActions[index];
    }),
});
