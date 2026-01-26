import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { pgQuery } from "../../db/postgres";

interface DbControlType {
  id: string;
  code: string;
  label: string;
  description: string | null;
  periodicity_days: number;
  active: boolean;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export const controlsRouter = createTRPCRouter({
  types: publicProcedure.query(async () => {
    console.log("[CONTROLS] Fetching control types from database");
    const types = await pgQuery<DbControlType>(
      "SELECT * FROM control_types WHERE active = true ORDER BY label"
    );
    console.log("[CONTROLS] Found control types:", types.length);
    return types.map((ct) => ({
      id: ct.id,
      code: ct.code,
      label: ct.label,
      description: ct.description || "",
      periodicity_days: ct.periodicity_days,
      active: ct.active,
    }));
  }),

  getTypeById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const types = await pgQuery<DbControlType>(
        "SELECT * FROM control_types WHERE id = $1",
        [input.id]
      );
      const ct = types[0];
      if (!ct) return null;
      return {
        id: ct.id,
        code: ct.code,
        label: ct.label,
        description: ct.description || "",
        periodicity_days: ct.periodicity_days,
        active: ct.active,
      };
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
      console.log("[CONTROLS] Fetching due echeances with filters:", input);

      let query = `
        SELECT ac.id, ac.asset_id, ac.next_due_at,
               a.code_interne as asset_code,
               a.designation as asset_designation,
               ct.label as control_type_label,
               s.name as site_name,
               s.id as site_id
        FROM asset_controls ac
        JOIN assets a ON ac.asset_id = a.id
        JOIN control_types ct ON ac.control_type_id = ct.id
        LEFT JOIN sites s ON a.site_id = s.id
        WHERE ac.next_due_at IS NOT NULL
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (input?.siteId) {
        query += ` AND a.site_id = $${paramIndex++}`;
        params.push(input.siteId);
      }

      query += " ORDER BY ac.next_due_at ASC";

      const results = await pgQuery<{
        id: string;
        asset_id: string;
        next_due_at: string;
        asset_code: string;
        asset_designation: string;
        control_type_label: string;
        site_name: string;
        site_id: string;
      }>(query, params);

      const now = new Date();
      let filtered = results.map((r) => {
        const nextDue = new Date(r.next_due_at);
        const diffTime = nextDue.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          id: r.id,
          asset_id: r.asset_id,
          asset_code: r.asset_code,
          asset_designation: r.asset_designation,
          control_type_label: r.control_type_label,
          next_due_at: r.next_due_at,
          days_remaining: daysRemaining,
          is_overdue: daysRemaining < 0,
          site_name: r.site_name || "",
        };
      });

      if (input?.overdueOnly) {
        filtered = filtered.filter((d) => d.is_overdue);
      }
      if (input?.dueSoonDays) {
        filtered = filtered.filter(
          (d) => d.days_remaining <= input.dueSoonDays! && !d.is_overdue
        );
      }

      console.log("[CONTROLS] Found due echeances:", filtered.length);
      return filtered;
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
      const id = generateId();

      await pgQuery(
        "INSERT INTO control_types (id, code, label, description, periodicity_days, active) VALUES ($1, $2, $3, $4, $5, true)",
        [id, input.code, input.label, input.description, input.periodicity_days]
      );

      return {
        id,
        ...input,
        active: true,
      };
    }),
});
