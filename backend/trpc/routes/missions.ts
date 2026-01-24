import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

type MissionStatus = "A_PLANIFIER" | "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";

interface MockMission {
  id: string;
  control_type_id: string;
  scheduled_at: string;
  assigned_to: string;
  status: MissionStatus;
  site_id: string;
  created_at: string;
  control_type_label: string;
  site_name: string;
  assigned_to_name: string;
}

const mockMissions: MockMission[] = [
  {
    id: "mission-1",
    control_type_id: "ct-1",
    scheduled_at: "2024-02-15",
    assigned_to: "user-1",
    status: "PLANIFIEE",
    site_id: "site-1",
    created_at: "2024-02-01",
    control_type_label: "VGP Périodique",
    site_name: "Site Principal",
    assigned_to_name: "Jean Technicien",
  },
  {
    id: "mission-2",
    control_type_id: "ct-2",
    scheduled_at: "2024-02-20",
    assigned_to: "user-1",
    status: "EN_COURS",
    site_id: "site-2",
    created_at: "2024-02-10",
    control_type_label: "VGP Renforcée",
    site_name: "Site Nord",
    assigned_to_name: "Jean Technicien",
  },
];

export const missionsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        siteId: z.string().optional(),
        status: z.string().optional(),
        assignedTo: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      let filtered = [...mockMissions];

      if (input?.siteId) {
        filtered = filtered.filter((m) => m.site_id === input.siteId);
      }
      if (input?.status) {
        filtered = filtered.filter((m) => m.status === input.status);
      }
      if (input?.assignedTo) {
        filtered = filtered.filter((m) => m.assigned_to === input.assignedTo);
      }

      return filtered;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return mockMissions.find((m) => m.id === input.id) || null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        control_type_id: z.string(),
        scheduled_at: z.string(),
        assigned_to: z.string(),
        site_id: z.string(),
        asset_ids: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const newMission = {
        id: `mission-${Date.now()}`,
        control_type_id: input.control_type_id,
        scheduled_at: input.scheduled_at,
        assigned_to: input.assigned_to,
        status: "PLANIFIEE" as MissionStatus,
        site_id: input.site_id,
        created_at: new Date().toISOString(),
        control_type_label: "",
        site_name: "",
        assigned_to_name: "",
      };
      mockMissions.push(newMission);
      return newMission;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["A_PLANIFIER", "PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]),
      })
    )
    .mutation(async ({ input }) => {
      const index = mockMissions.findIndex((m) => m.id === input.id);
      if (index === -1) {
        throw new Error("Mission not found");
      }
      mockMissions[index].status = input.status;
      return mockMissions[index];
    }),
});
