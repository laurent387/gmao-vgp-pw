import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

const mockControlTypes = [
  {
    id: "ct-1",
    code: "VGP",
    label: "VGP Périodique",
    description: "Vérification Générale Périodique - Contrôle annuel obligatoire",
    periodicity_days: 365,
    active: true,
  },
  {
    id: "ct-2",
    code: "VGP_RENFORCE",
    label: "VGP Renforcée",
    description: "VGP avec périodicité renforcée pour équipements critiques",
    periodicity_days: 180,
    active: true,
  },
  {
    id: "ct-3",
    code: "MISE_EN_SERVICE",
    label: "Vérification Mise en Service",
    description: "Contrôle initial avant première utilisation",
    periodicity_days: 0,
    active: true,
  },
  {
    id: "ct-4",
    code: "REMISE_EN_SERVICE",
    label: "Remise en Service",
    description: "Contrôle après réparation ou modification",
    periodicity_days: 0,
    active: true,
  },
];

const mockDueEcheances = [
  {
    id: "due-1",
    asset_id: "asset-1",
    asset_code: "CHAR-001",
    asset_designation: "Chariot élévateur Toyota",
    control_type_label: "VGP Périodique",
    next_due_at: "2024-06-15",
    days_remaining: -30,
    is_overdue: true,
    site_name: "Site Principal",
  },
  {
    id: "due-2",
    asset_id: "asset-3",
    asset_code: "NAC-001",
    asset_designation: "Nacelle élévatrice JLG",
    control_type_label: "VGP Périodique",
    next_due_at: "2024-01-20",
    days_remaining: -60,
    is_overdue: true,
    site_name: "Site Nord",
  },
  {
    id: "due-3",
    asset_id: "asset-2",
    asset_code: "GRUE-001",
    asset_designation: "Grue à tour Liebherr",
    control_type_label: "VGP Périodique",
    next_due_at: "2024-09-10",
    days_remaining: 45,
    is_overdue: false,
    site_name: "Site Principal",
  },
];

export const controlsRouter = createTRPCRouter({
  types: publicProcedure.query(async () => {
    return mockControlTypes.filter((ct) => ct.active);
  }),

  getTypeById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return mockControlTypes.find((ct) => ct.id === input.id) || null;
    }),

  dueEcheances: publicProcedure
    .input(
      z.object({
        siteId: z.string().optional(),
        overdueOnly: z.boolean().optional(),
        dueSoonDays: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      let filtered = [...mockDueEcheances];

      if (input?.siteId) {
        const siteId = input.siteId;
        filtered = filtered.filter((d) => d.site_name.includes(siteId));
      }
      if (input?.overdueOnly) {
        filtered = filtered.filter((d) => d.is_overdue);
      }
      if (input?.dueSoonDays) {
        filtered = filtered.filter(
          (d) => d.days_remaining <= input.dueSoonDays! && !d.is_overdue
        );
      }

      return filtered.sort((a, b) => a.days_remaining - b.days_remaining);
    }),

  createType: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1),
        label: z.string().min(1),
        description: z.string(),
        periodicity_days: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const newType = {
        id: `ct-${Date.now()}`,
        ...input,
        active: true,
      };
      mockControlTypes.push(newType);
      return newType;
    }),
});
