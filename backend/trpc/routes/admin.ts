import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../create-context";
import { ensurePgSchema, getPgPool } from "../../db/postgres";

function generateId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

function isoNow(): string {
  return new Date().toISOString();
}

type SeedCounts = {
  users: number;
  sites: number;
  zones: number;
  assets: number;
  controlTypes: number;
  assetControls: number;
  missions: number;
  missionAssets: number;
  reports: number;
  reportItemResults: number;
  nonconformities: number;
  correctiveActions: number;
  maintenanceLogs: number;
};

const TABLES_DELETE_ORDER: string[] = [
  "outbox",
  "documents",
  "maintenance_logs",
  "corrective_actions",
  "nonconformities",
  "report_item_results",
  "reports",
  "mission_assets",
  "missions",
  "checklist_items",
  "checklist_templates",
  "asset_controls",
  "control_types",
  "assets",
  "zones",
  "sites",
  "users",
];

export const adminRouter = createTRPCRouter({
  seedPostgres: protectedProcedure
    .input(
      z.object({
        forceReset: z.boolean().default(false),
        assetsPerSite: z.number().min(1).max(50).default(10),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[ADMIN] seedPostgres called", input);

      await ensurePgSchema();

      const pool = getPgPool();
      const client = await pool.connect();

      const counts: SeedCounts = {
        users: 0,
        sites: 0,
        zones: 0,
        assets: 0,
        controlTypes: 0,
        assetControls: 0,
        missions: 0,
        missionAssets: 0,
        reports: 0,
        reportItemResults: 0,
        nonconformities: 0,
        correctiveActions: 0,
        maintenanceLogs: 0,
      };

      try {
        await client.query("BEGIN");

        if (input.forceReset) {
          console.log("[ADMIN] forceReset enabled -> clearing tables");
          for (const t of TABLES_DELETE_ORDER) {
            await client.query(`DELETE FROM ${t};`);
          }
        } else {
          const existingUsers = await client.query<{ c: string }>(
            "SELECT COUNT(*)::text as c FROM users;"
          );
          const c = Number(existingUsers.rows[0]?.c ?? "0");
          if (c > 0) {
            console.log("[ADMIN] Users already exist, skipping seed. Use forceReset=true to reseed.");
            await client.query("ROLLBACK");
            return {
              ok: true as const,
              skipped: true as const,
              reason: "Database already seeded (users > 0).",
              counts,
            };
          }
        }

        const now = isoNow();

        const users = [
          {
            id: generateId(),
            email: "technicien@inspectra.fr",
            name: "Jean Dupont",
            role: "TECHNICIAN",
            token_mock: "mock_token_tech",
          },
          {
            id: generateId(),
            email: "hse@inspectra.fr",
            name: "Marie Martin",
            role: "HSE_MANAGER",
            token_mock: "mock_token_hse",
          },
          {
            id: generateId(),
            email: "admin@inspectra.fr",
            name: "Admin Système",
            role: "ADMIN",
            token_mock: "mock_token_admin",
          },
          {
            id: generateId(),
            email: "auditeur@inspectra.fr",
            name: "Pierre Auditeur",
            role: "AUDITOR",
            token_mock: "mock_token_auditor",
          },
        ] as const;

        for (const u of users) {
          await client.query(
            `INSERT INTO users (id, email, name, role, token_mock, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [u.id, u.email, u.name, u.role, u.token_mock, now]
          );
          counts.users++;
        }

        const controlTypes = [
          {
            id: generateId(),
            code: "VGP_PERIODIQUE",
            label: "VGP Périodique",
            description: "Vérification Générale Périodique annuelle",
            periodicity_days: 365,
            active: true,
          },
          {
            id: generateId(),
            code: "VGP_RENFORCE",
            label: "VGP Renforcée",
            description: "VGP semestrielle pour équipements à usage intensif",
            periodicity_days: 180,
            active: true,
          },
        ] as const;

        for (const ct of controlTypes) {
          await client.query(
            `INSERT INTO control_types (id, code, label, description, periodicity_days, active)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [ct.id, ct.code, ct.label, ct.description, ct.periodicity_days, ct.active]
          );
          counts.controlTypes++;
        }

        const sites = [
          {
            id: generateId(),
            name: "Carrefour Logistique Lyon",
            address: "123 Rue de l'Industrie, 69000 Lyon",
            zones: ["Zone A - Production", "Zone B - Stockage"],
          },
          {
            id: generateId(),
            name: "Amazon Fulfilment Satolas",
            address: "45 Zone Industrielle Est, 69125 Lyon-Saint-Exupéry",
            zones: ["Réception", "Expédition", "Picking"],
          },
          {
            id: generateId(),
            name: "Michelin Clermont-Ferrand",
            address: "12 Place des Carmes, 63000 Clermont-Ferrand",
            zones: ["Atelier Nord", "Atelier Sud", "Magasin"],
          },
        ] as const;

        const zoneIdsBySite: Record<string, string[]> = {};

        for (const s of sites) {
          await client.query(
            `INSERT INTO sites (id, name, address, created_at)
             VALUES ($1, $2, $3, $4)`,
            [s.id, s.name, s.address, now]
          );
          counts.sites++;

          zoneIdsBySite[s.id] = [];
          for (const zn of s.zones) {
            const zid = generateId();
            await client.query(
              `INSERT INTO zones (id, site_id, name)
               VALUES ($1, $2, $3)`,
              [zid, s.id, zn]
            );
            zoneIdsBySite[s.id].push(zid);
            counts.zones++;
          }
        }

        const assetTemplates = [
          {
            prefix: "CHE",
            designation: "Chariot élévateur",
            categorie: "Chariot élévateur",
            marque: "Toyota",
            modele: "8FBE15",
          },
          {
            prefix: "NAC",
            designation: "Nacelle élévatrice",
            categorie: "Nacelle",
            marque: "JLG",
            modele: "450AJ",
          },
          {
            prefix: "PON",
            designation: "Pont roulant",
            categorie: "Pont roulant",
            marque: "Demag",
            modele: "EKDR 5",
          },
        ] as const;

        const assetsBySite: Record<string, string[]> = {};

        for (const s of sites) {
          assetsBySite[s.id] = [];

          const zoneIds = zoneIdsBySite[s.id];
          for (let i = 0; i < input.assetsPerSite; i++) {
            const t = assetTemplates[i % assetTemplates.length];
            const assetId = generateId();
            const code = `${t.prefix}-${String(i + 1).padStart(3, "0")}`;
            const zoneId = zoneIds[i % zoneIds.length];

            await client.query(
              `INSERT INTO assets (
                id, code_interne, designation, categorie, marque, modele, numero_serie, annee, statut, criticite,
                site_id, zone_id, mise_en_service, created_at
              ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                $11,$12,$13,$14
              )`,
              [
                assetId,
                code,
                `${t.designation} ${t.marque} ${t.modele}`,
                t.categorie,
                t.marque,
                t.modele,
                `${t.prefix}${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`,
                2019 + (i % 6),
                "EN_SERVICE",
                1 + (i % 5),
                s.id,
                zoneId,
                now,
                now,
              ]
            );
            counts.assets++;
            assetsBySite[s.id].push(assetId);

            const acId = generateId();
            await client.query(
              `INSERT INTO asset_controls (id, asset_id, control_type_id, start_date, last_done_at, next_due_at)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [acId, assetId, controlTypes[0].id, now, now, now]
            );
            counts.assetControls++;
          }
        }

        const missionId = generateId();
        const chosenSite = sites[0];
        await client.query(
          `INSERT INTO missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            missionId,
            controlTypes[0].id,
            now,
            users[0].id,
            "TERMINEE",
            chosenSite.id,
            now,
          ]
        );
        counts.missions++;

        const chosenAssetIds = assetsBySite[chosenSite.id].slice(0, Math.min(3, assetsBySite[chosenSite.id].length));

        for (const assetId of chosenAssetIds) {
          const maId = generateId();
          await client.query(
            `INSERT INTO mission_assets (id, mission_id, asset_id)
             VALUES ($1,$2,$3)`,
            [maId, missionId, assetId]
          );
          counts.missionAssets++;

          const reportId = generateId();
          await client.query(
            `INSERT INTO reports (id, mission_id, asset_id, performed_at, performer, conclusion, summary, signed_by_name, signed_at, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              reportId,
              missionId,
              assetId,
              now,
              users[0].name,
              "CONFORME",
              "Contrôle effectué sans anomalie.",
              users[0].name,
              now,
              now,
            ]
          );
          counts.reports++;

          const ncId = generateId();
          await client.query(
            `INSERT INTO nonconformities (id, report_id, asset_id, checklist_item_id, title, description, severity, status, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
              ncId,
              reportId,
              assetId,
              null,
              "Marquage effacé",
              "Marquages de charge et sécurité illisibles.",
              3,
              "OUVERTE",
              now,
            ]
          );
          counts.nonconformities++;

          const actionId = generateId();
          await client.query(
            `INSERT INTO corrective_actions (id, nonconformity_id, owner, description, due_at, status, closed_at, validated_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              actionId,
              ncId,
              users[0].id,
              "Remplacer les autocollants de sécurité.",
              now,
              "OUVERTE",
              null,
              null,
            ]
          );
          counts.correctiveActions++;

          const maintId = generateId();
          await client.query(
            `INSERT INTO maintenance_logs (id, asset_id, date, actor, operation_type, description, parts_ref, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              maintId,
              assetId,
              now,
              users[0].name,
              "INSPECTION",
              "Graissage général des points de lubrification",
              null,
              now,
            ]
          );
          counts.maintenanceLogs++;
        }

        await client.query("COMMIT");
        console.log("[ADMIN] Seed completed", counts);

        return {
          ok: true as const,
          skipped: false as const,
          counts,
        };
      } catch (e) {
        await client.query("ROLLBACK");
        const message = e instanceof Error ? e.message : "Unknown error";
        console.error("[ADMIN] Seed failed", message);
        throw new Error(message);
      } finally {
        client.release();
      }
    }),
});
