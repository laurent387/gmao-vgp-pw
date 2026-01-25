import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { pgQuery } from "../../db/postgres";

interface DbSite {
  id: string;
  client_id: string | null;
  name: string;
  address: string | null;
  created_at: string;
  client_name?: string | null;
}

interface DbZone {
  id: string;
  site_id: string;
  name: string;
}

interface DbClient {
  id: string;
  name: string;
  created_at: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export const sitesRouter = createTRPCRouter({
  clients: publicProcedure.query(async () => {
    console.log("[SITES] Fetching clients from database");
    const clients = await pgQuery<DbClient>(
      "SELECT id, name, created_at FROM clients ORDER BY name"
    );
    console.log("[SITES] Found clients:", clients.length);
    return clients.map((c) => ({
      id: c.id,
      name: c.name,
      created_at: c.created_at,
    }));
  }),

  list: publicProcedure.query(async () => {
    console.log("[SITES] Fetching all sites from database");
    const sites = await pgQuery<DbSite & { client_name: string | null }>(
      `SELECT s.*, c.name as client_name
       FROM sites s
       LEFT JOIN clients c ON s.client_id = c.id
       ORDER BY c.name, s.name`
    );
    console.log("[SITES] Found sites:", sites.length);
    return sites.map((s) => ({
      id: s.id,
      client_id: s.client_id,
      name: s.name,
      address: s.address || "",
      created_at: s.created_at,
      client_name: s.client_name || "",
    }));
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const sites = await pgQuery<DbSite & { client_name: string | null }>(
        `SELECT s.*, c.name as client_name
         FROM sites s
         LEFT JOIN clients c ON s.client_id = c.id
         WHERE s.id = $1`,
        [input.id]
      );
      const site = sites[0];
      if (!site) return null;
      return {
        id: site.id,
        client_id: site.client_id,
        name: site.name,
        address: site.address || "",
        created_at: site.created_at,
        client_name: site.client_name || "",
      };
    }),

  zones: publicProcedure
    .input(z.object({ siteId: z.string().optional() }))
    .query(async ({ input }) => {
      console.log("[SITES] Fetching zones, siteId:", input.siteId);
      
      let zones: DbZone[];
      if (input.siteId) {
        zones = await pgQuery<DbZone>(
          "SELECT z.*, s.name as site_name FROM zones z JOIN sites s ON z.site_id = s.id WHERE z.site_id = $1 ORDER BY z.name",
          [input.siteId]
        );
      } else {
        zones = await pgQuery<DbZone & { site_name: string }>(
          "SELECT z.*, s.name as site_name FROM zones z JOIN sites s ON z.site_id = s.id ORDER BY z.name"
        );
      }
      
      console.log("[SITES] Found zones:", zones.length);
      return zones.map((z: any) => ({
        id: z.id,
        site_id: z.site_id,
        name: z.name,
        site_name: z.site_name || "",
      }));
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string().min(1),
        name: z.string().min(1),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();
      const now = new Date().toISOString();
      
      await pgQuery(
        "INSERT INTO sites (id, client_id, name, address, created_at) VALUES ($1, $2, $3, $4, $5)",
        [id, input.clientId, input.name, input.address || null, now]
      );

      return {
        id,
        client_id: input.clientId,
        name: input.name,
        address: input.address || "",
        created_at: now,
      };
    }),

  createZone: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();
      
      const sites = await pgQuery<DbSite>(
        "SELECT * FROM sites WHERE id = $1",
        [input.siteId]
      );
      const site = sites[0];

      await pgQuery(
        "INSERT INTO zones (id, site_id, name) VALUES ($1, $2, $3)",
        [id, input.siteId, input.name]
      );

      return {
        id,
        site_id: input.siteId,
        name: input.name,
        site_name: site?.name || "",
      };
    }),
});
