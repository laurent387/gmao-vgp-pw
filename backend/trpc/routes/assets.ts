import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

type AssetStatus = "EN_SERVICE" | "HORS_SERVICE" | "REBUT" | "EN_LOCATION";
type Criticite = 1 | 2 | 3 | 4 | 5;

interface MockAsset {
  id: string;
  code_interne: string;
  designation: string;
  categorie: string;
  marque: string;
  modele: string;
  numero_serie: string;
  annee: number;
  statut: AssetStatus;
  criticite: Criticite;
  site_id: string;
  zone_id: string;
  mise_en_service: string | null;
  created_at: string;
  site_name: string;
  zone_name: string;
  next_due_at: string | null;
  is_overdue: boolean;
}

const mockAssets: MockAsset[] = [
  {
    id: "asset-1",
    code_interne: "CHAR-001",
    designation: "Chariot élévateur Toyota",
    categorie: "Chariot élévateur",
    marque: "Toyota",
    modele: "8FGCU25",
    numero_serie: "8FGCU25-12345",
    annee: 2020,
    statut: "EN_SERVICE",
    criticite: 3,
    site_id: "site-1",
    zone_id: "zone-1",
    mise_en_service: "2020-06-15",
    created_at: "2020-06-01",
    site_name: "Site Principal",
    zone_name: "Atelier Mécanique",
    next_due_at: "2024-06-15",
    is_overdue: true,
  },
  {
    id: "asset-2",
    code_interne: "GRUE-001",
    designation: "Grue à tour Liebherr",
    categorie: "Grue",
    marque: "Liebherr",
    modele: "EC-B 6",
    numero_serie: "LH-EC-B6-98765",
    annee: 2019,
    statut: "EN_SERVICE",
    criticite: 5,
    site_id: "site-1",
    zone_id: "zone-2",
    mise_en_service: "2019-03-10",
    created_at: "2019-03-01",
    site_name: "Site Principal",
    zone_name: "Zone Stockage",
    next_due_at: "2024-09-10",
    is_overdue: false,
  },
  {
    id: "asset-3",
    code_interne: "NAC-001",
    designation: "Nacelle élévatrice JLG",
    categorie: "Nacelle",
    marque: "JLG",
    modele: "450AJ",
    numero_serie: "JLG-450AJ-54321",
    annee: 2021,
    statut: "EN_SERVICE",
    criticite: 4,
    site_id: "site-2",
    zone_id: "zone-3",
    mise_en_service: "2021-01-20",
    created_at: "2021-01-15",
    site_name: "Site Nord",
    zone_name: "Entrepôt A",
    next_due_at: "2024-01-20",
    is_overdue: true,
  },
];

export const assetsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        siteId: z.string().optional(),
        zoneId: z.string().optional(),
        status: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      let filtered = [...mockAssets];

      if (input?.siteId) {
        filtered = filtered.filter((a) => a.site_id === input.siteId);
      }
      if (input?.zoneId) {
        filtered = filtered.filter((a) => a.zone_id === input.zoneId);
      }
      if (input?.status) {
        filtered = filtered.filter((a) => a.statut === input.status);
      }
      if (input?.category) {
        filtered = filtered.filter((a) => a.categorie === input.category);
      }
      if (input?.search) {
        const search = input.search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.code_interne.toLowerCase().includes(search) ||
            a.designation.toLowerCase().includes(search)
        );
      }

      return filtered;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return mockAssets.find((a) => a.id === input.id) || null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        code_interne: z.string().min(1),
        designation: z.string().min(1),
        categorie: z.string().min(1),
        marque: z.string().min(1),
        modele: z.string().min(1),
        numero_serie: z.string().min(1),
        annee: z.number().min(1900).max(2100),
        statut: z.enum(["EN_SERVICE", "HORS_SERVICE", "REBUT", "EN_LOCATION"]),
        criticite: z.number().min(1).max(5),
        site_id: z.string(),
        zone_id: z.string(),
        mise_en_service: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const newAsset = {
        id: `asset-${Date.now()}`,
        ...input,
        mise_en_service: input.mise_en_service || null,
        created_at: new Date().toISOString(),
        site_name: "",
        zone_name: "",
        next_due_at: null,
        is_overdue: false,
      };
      mockAssets.push(newAsset as MockAsset);
      return newAsset;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          designation: z.string().optional(),
          statut: z.enum(["EN_SERVICE", "HORS_SERVICE", "REBUT", "EN_LOCATION"]).optional(),
          criticite: z.number().min(1).max(5).optional(),
          site_id: z.string().optional(),
          zone_id: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const index = mockAssets.findIndex((a) => a.id === input.id);
      if (index === -1) {
        throw new Error("Asset not found");
      }
      mockAssets[index] = { ...mockAssets[index], ...input.data } as MockAsset;
      return mockAssets[index];
    }),

  categories: publicProcedure.query(async () => {
    const categories = [...new Set(mockAssets.map((a) => a.categorie))];
    return categories;
  }),
});
