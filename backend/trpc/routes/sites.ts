import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

const mockSites = [
  { id: "site-1", name: "Site Principal", address: "123 Rue de l'Industrie, 75001 Paris", created_at: "2024-01-01" },
  { id: "site-2", name: "Site Nord", address: "456 Avenue du Nord, 59000 Lille", created_at: "2024-01-15" },
];

const mockZones = [
  { id: "zone-1", site_id: "site-1", name: "Atelier Mécanique", site_name: "Site Principal" },
  { id: "zone-2", site_id: "site-1", name: "Zone Stockage", site_name: "Site Principal" },
  { id: "zone-3", site_id: "site-2", name: "Entrepôt A", site_name: "Site Nord" },
  { id: "zone-4", site_id: "site-2", name: "Entrepôt B", site_name: "Site Nord" },
];

export const sitesRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return mockSites;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return mockSites.find((s) => s.id === input.id) || null;
    }),

  zones: publicProcedure
    .input(z.object({ siteId: z.string().optional() }))
    .query(async ({ input }) => {
      if (input.siteId) {
        return mockZones.filter((z) => z.site_id === input.siteId);
      }
      return mockZones;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const newSite = {
        id: `site-${Date.now()}`,
        name: input.name,
        address: input.address || "",
        created_at: new Date().toISOString(),
      };
      mockSites.push(newSite);
      return newSite;
    }),

  createZone: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const site = mockSites.find((s) => s.id === input.siteId);
      const newZone = {
        id: `zone-${Date.now()}`,
        site_id: input.siteId,
        name: input.name,
        site_name: site?.name || "",
      };
      mockZones.push(newZone);
      return newZone;
    }),
});
