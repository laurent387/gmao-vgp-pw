import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

const mockReports: Array<{
  id: string;
  mission_id: string;
  asset_id: string;
  performed_at: string;
  performer: string;
  conclusion: "CONFORME" | "NON_CONFORME" | "CONFORME_SOUS_RESERVE";
  summary: string;
  signed_by_name: string | null;
  signed_at: string | null;
  created_at: string;
}> = [
  {
    id: "report-1",
    mission_id: "mission-1",
    asset_id: "asset-1",
    performed_at: "2024-01-15",
    performer: "Jean Technicien",
    conclusion: "CONFORME",
    summary: "Contrôle effectué sans anomalie. Équipement conforme.",
    signed_by_name: "Jean Technicien",
    signed_at: "2024-01-15T14:30:00Z",
    created_at: "2024-01-15",
  },
  {
    id: "report-2",
    mission_id: "mission-2",
    asset_id: "asset-2",
    performed_at: "2024-02-01",
    performer: "Jean Technicien",
    conclusion: "NON_CONFORME",
    summary: "Anomalie détectée sur le système de freinage. Action corrective requise.",
    signed_by_name: "Jean Technicien",
    signed_at: "2024-02-01T16:00:00Z",
    created_at: "2024-02-01",
  },
];

export const reportsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        missionId: z.string().optional(),
        assetId: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      let filtered = [...mockReports];

      if (input?.missionId) {
        filtered = filtered.filter((r) => r.mission_id === input.missionId);
      }
      if (input?.assetId) {
        filtered = filtered.filter((r) => r.asset_id === input.assetId);
      }

      return filtered;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return mockReports.find((r) => r.id === input.id) || null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        mission_id: z.string(),
        asset_id: z.string(),
        performer: z.string(),
        conclusion: z.enum(["CONFORME", "NON_CONFORME", "CONFORME_SOUS_RESERVE"]),
        summary: z.string(),
        signed_by_name: z.string().optional(),
        items: z.array(
          z.object({
            checklist_item_id: z.string(),
            status: z.enum(["OK", "KO", "NA"]),
            value_num: z.number().optional(),
            value_text: z.string().optional(),
            comment: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const newReport = {
        id: `report-${Date.now()}`,
        mission_id: input.mission_id,
        asset_id: input.asset_id,
        performed_at: new Date().toISOString().split("T")[0],
        performer: input.performer,
        conclusion: input.conclusion,
        summary: input.summary,
        signed_by_name: input.signed_by_name || null,
        signed_at: input.signed_by_name ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      };
      mockReports.push(newReport);
      return newReport;
    }),
});
