import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

export const syncRouter = createTRPCRouter({
  push: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            type: z.string(),
            payload: z.any(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`[SYNC] Received ${input.items.length} items to sync`);
      
      const results = input.items.map((item) => ({
        id: item.id,
        success: true,
        serverId: `server-${item.id}`,
      }));

      return {
        synced: results.length,
        results,
      };
    }),

  pull: protectedProcedure
    .input(
      z.object({
        lastSyncAt: z.string().optional(),
        entities: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      console.log(`[SYNC] Pull request since ${input.lastSyncAt || "beginning"}`);

      return {
        timestamp: new Date().toISOString(),
        changes: {
          sites: [],
          zones: [],
          assets: [],
          controlTypes: [],
          missions: [],
        },
      };
    }),

  status: publicProcedure.query(async () => {
    return {
      serverTime: new Date().toISOString(),
      version: "1.0.0",
      status: "healthy",
    };
  }),
});
