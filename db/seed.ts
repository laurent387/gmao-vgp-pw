import { getDatabase } from './database';
import { Platform } from 'react-native';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function seedDatabase(): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('[SEED] Skipping seed on web platform');
    return;
  }

  const db = await getDatabase();
  
  const existingUser = await db.getFirstAsync<{ id: string }>('SELECT id FROM users LIMIT 1');
  if (existingUser) {
    console.log('[SEED] Database already seeded, skipping');
    return;
  }
  
  console.log('[SEED] Starting database seed...');
  
  const now = new Date();
  const userId1 = generateId();
  const userId2 = generateId();
  const siteId = generateId();
  const zone1Id = generateId();
  const zone2Id = generateId();
  
  await db.runAsync(
    `INSERT INTO users (id, email, name, role, token_mock, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId1, 'technicien@inspectra.fr', 'Jean Dupont', 'TECHNICIAN', 'mock_token_tech_123', formatDate(now)]
  );
  
  await db.runAsync(
    `INSERT INTO users (id, email, name, role, token_mock, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId2, 'hse@inspectra.fr', 'Marie Martin', 'HSE_MANAGER', 'mock_token_hse_456', formatDate(now)]
  );
  
  await db.runAsync(
    `INSERT INTO sites (id, name, address, created_at) VALUES (?, ?, ?, ?)`,
    [siteId, 'Site Principal - Lyon', '123 Rue de l\'Industrie, 69000 Lyon', formatDate(now)]
  );
  
  await db.runAsync(
    `INSERT INTO zones (id, site_id, name) VALUES (?, ?, ?)`,
    [zone1Id, siteId, 'Zone A - Production']
  );
  
  await db.runAsync(
    `INSERT INTO zones (id, site_id, name) VALUES (?, ?, ?)`,
    [zone2Id, siteId, 'Zone B - Stockage']
  );
  
  const ctVGP = generateId();
  const ctVGPRenforce = generateId();
  const ctRemiseEnService = generateId();
  
  await db.runAsync(
    `INSERT INTO control_types (id, code, label, description, periodicity_days, active) VALUES (?, ?, ?, ?, ?, ?)`,
    [ctVGP, 'VGP_PERIODIQUE', 'VGP Périodique', 'Vérification Générale Périodique annuelle', 365, 1]
  );
  
  await db.runAsync(
    `INSERT INTO control_types (id, code, label, description, periodicity_days, active) VALUES (?, ?, ?, ?, ?, ?)`,
    [ctVGPRenforce, 'VGP_RENFORCE', 'VGP Renforcée', 'VGP semestrielle pour équipements à usage intensif', 180, 1]
  );
  
  await db.runAsync(
    `INSERT INTO control_types (id, code, label, description, periodicity_days, active) VALUES (?, ?, ?, ?, ?, ?)`,
    [ctRemiseEnService, 'REMISE_SERVICE', 'Remise en Service', 'Vérification avant remise en service après arrêt prolongé', 0, 1]
  );
  
  const templateVGP = generateId();
  const templateRemise = generateId();
  
  await db.runAsync(
    `INSERT INTO checklist_templates (id, control_type_id, asset_category, name) VALUES (?, ?, ?, ?)`,
    [templateVGP, ctVGP, null, 'Checklist VGP Standard']
  );
  
  await db.runAsync(
    `INSERT INTO checklist_templates (id, control_type_id, asset_category, name) VALUES (?, ?, ?, ?)`,
    [templateRemise, ctRemiseEnService, null, 'Checklist Remise en Service']
  );
  
  const vgpItems = [
    { label: 'État général de l\'équipement', type: 'BOOL', help: 'Vérifier absence de dommages visibles' },
    { label: 'Fonctionnement du système de levage', type: 'BOOL', help: 'Tester le levage en charge' },
    { label: 'État des câbles/chaînes', type: 'BOOL', help: 'Vérifier usure et intégrité' },
    { label: 'Dispositifs de sécurité', type: 'BOOL', help: 'Tester fins de course, limiteurs' },
    { label: 'Freins', type: 'BOOL', help: 'Tester efficacité des freins' },
    { label: 'Commandes et indicateurs', type: 'BOOL', help: 'Vérifier bon fonctionnement' },
    { label: 'Pression hydraulique (bar)', type: 'NUM', help: 'Relever pression du circuit' },
    { label: 'Niveau d\'huile', type: 'BOOL', help: 'Vérifier niveau et qualité' },
    { label: 'Étiquetage et marquages', type: 'BOOL', help: 'Vérifier présence et lisibilité' },
    { label: 'Documentation à bord', type: 'BOOL', help: 'Vérifier présence carnet maintenance' },
    { label: 'Observations générales', type: 'TEXT', help: 'Notes additionnelles' },
    { label: 'Charge maximale testée (kg)', type: 'NUM', help: 'Indiquer charge de test' },
  ];
  
  for (let i = 0; i < vgpItems.length; i++) {
    await db.runAsync(
      `INSERT INTO checklist_items (id, template_id, label, field_type, required, help_text, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), templateVGP, vgpItems[i].label, vgpItems[i].type, vgpItems[i].type !== 'TEXT' ? 1 : 0, vgpItems[i].help, i + 1]
    );
  }
  
  const remiseItems = [
    { label: 'Inspection visuelle complète', type: 'BOOL', help: 'Rechercher corrosion, fissures, déformations' },
    { label: 'Vérification lubrification', type: 'BOOL', help: 'Contrôler tous points de graissage' },
    { label: 'Test électrique', type: 'BOOL', help: 'Vérifier isolation et connexions' },
    { label: 'Test hydraulique', type: 'BOOL', help: 'Vérifier absence de fuites' },
    { label: 'Essai à vide', type: 'BOOL', help: 'Tester tous mouvements sans charge' },
    { label: 'Essai en charge', type: 'BOOL', help: 'Tester avec charge nominale' },
    { label: 'Dispositifs de sécurité', type: 'BOOL', help: 'Tester tous dispositifs' },
    { label: 'Mesure résistance isolation (MΩ)', type: 'NUM', help: 'Utiliser mégohmmètre' },
    { label: 'Durée d\'arrêt (jours)', type: 'NUM', help: 'Indiquer durée depuis dernier usage' },
    { label: 'Cause de l\'arrêt', type: 'TEXT', help: 'Décrire raison de l\'arrêt' },
    { label: 'Actions correctives effectuées', type: 'TEXT', help: 'Lister interventions réalisées' },
    { label: 'Recommandations', type: 'TEXT', help: 'Notes pour suivi' },
  ];
  
  for (let i = 0; i < remiseItems.length; i++) {
    await db.runAsync(
      `INSERT INTO checklist_items (id, template_id, label, field_type, required, help_text, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), templateRemise, remiseItems[i].label, remiseItems[i].type, remiseItems[i].type !== 'TEXT' ? 1 : 0, remiseItems[i].help, i + 1]
    );
  }
  
  const assets = [
    { code: 'CHE-001', designation: 'Chariot élévateur Jungheinrich EFG 216', categorie: 'Chariot élévateur', marque: 'Jungheinrich', modele: 'EFG 216', serie: 'JH2024001', annee: 2022, zone: zone1Id, criticite: 4, daysOffset: -30 },
    { code: 'CHE-002', designation: 'Chariot élévateur Toyota 8FBE15', categorie: 'Chariot élévateur', marque: 'Toyota', modele: '8FBE15', serie: 'TY2023045', annee: 2021, zone: zone1Id, criticite: 4, daysOffset: 45 },
    { code: 'PON-001', designation: 'Pont roulant 5T Demag', categorie: 'Pont roulant', marque: 'Demag', modele: 'EKDR 5', serie: 'DM2020112', annee: 2020, zone: zone1Id, criticite: 5, daysOffset: -15 },
    { code: 'PAL-001', designation: 'Gerbeur électrique Linde L14', categorie: 'Gerbeur', marque: 'Linde', modele: 'L14', serie: 'LI2023078', annee: 2023, zone: zone2Id, criticite: 3, daysOffset: 120 },
    { code: 'PAL-002', designation: 'Transpalette électrique BT Levio LWE200', categorie: 'Transpalette', marque: 'BT', modele: 'LWE200', serie: 'BT2022034', annee: 2022, zone: zone2Id, criticite: 2, daysOffset: 200 },
    { code: 'GRU-001', designation: 'Grue mobile Liebherr LTM 1030', categorie: 'Grue mobile', marque: 'Liebherr', modele: 'LTM 1030', serie: 'LB2019056', annee: 2019, zone: zone1Id, criticite: 5, daysOffset: -5 },
    { code: 'NAC-001', designation: 'Nacelle élévatrice JLG 450AJ', categorie: 'Nacelle', marque: 'JLG', modele: '450AJ', serie: 'JL2021089', annee: 2021, zone: zone1Id, criticite: 4, daysOffset: 60 },
    { code: 'NAC-002', designation: 'Nacelle ciseaux Haulotte Compact 10', categorie: 'Nacelle', marque: 'Haulotte', modele: 'Compact 10', serie: 'HA2022012', annee: 2022, zone: zone2Id, criticite: 3, daysOffset: 90 },
    { code: 'TRE-001', designation: 'Treuil électrique Verlinde Eurochain', categorie: 'Treuil', marque: 'Verlinde', modele: 'Eurochain VL5', serie: 'VE2020067', annee: 2020, zone: zone1Id, criticite: 3, daysOffset: 180 },
    { code: 'PAL-003', designation: 'Gerbeur manuel Pramac GX12/29', categorie: 'Gerbeur', marque: 'Pramac', modele: 'GX12/29', serie: 'PR2023045', annee: 2023, zone: zone2Id, criticite: 2, daysOffset: 250 },
  ];
  
  const assetIds: string[] = [];
  
  for (const asset of assets) {
    const assetId = generateId();
    assetIds.push(assetId);
    const miseEnService = addDays(now, -365 * (now.getFullYear() - asset.annee));
    
    await db.runAsync(
      `INSERT INTO assets (id, code_interne, designation, categorie, marque, modele, numero_serie, annee, statut, criticite, site_id, zone_id, mise_en_service, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [assetId, asset.code, asset.designation, asset.categorie, asset.marque, asset.modele, asset.serie, asset.annee, 'EN_SERVICE', asset.criticite, siteId, asset.zone, formatDate(miseEnService), formatDate(now)]
    );
    
    const acId = generateId();
    const nextDue = addDays(now, asset.daysOffset);
    const lastDone = addDays(nextDue, -365);
    
    await db.runAsync(
      `INSERT INTO asset_controls (id, asset_id, control_type_id, start_date, last_done_at, next_due_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [acId, assetId, ctVGP, formatDate(lastDone), formatDate(lastDone), formatDate(nextDue)]
    );
  }
  
  const mission1Id = generateId();
  const mission2Id = generateId();
  
  await db.runAsync(
    `INSERT INTO missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mission1Id, ctVGP, formatDate(addDays(now, -30)), userId1, 'TERMINEE', siteId, formatDate(addDays(now, -35))]
  );
  
  await db.runAsync(
    `INSERT INTO missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mission2Id, ctVGP, formatDate(addDays(now, 7)), userId1, 'PLANIFIEE', siteId, formatDate(now)]
  );
  
  await db.runAsync(
    `INSERT INTO mission_assets (id, mission_id, asset_id) VALUES (?, ?, ?)`,
    [generateId(), mission1Id, assetIds[0]]
  );
  
  await db.runAsync(
    `INSERT INTO mission_assets (id, mission_id, asset_id) VALUES (?, ?, ?)`,
    [generateId(), mission1Id, assetIds[1]]
  );
  
  await db.runAsync(
    `INSERT INTO mission_assets (id, mission_id, asset_id) VALUES (?, ?, ?)`,
    [generateId(), mission2Id, assetIds[2]]
  );
  
  await db.runAsync(
    `INSERT INTO mission_assets (id, mission_id, asset_id) VALUES (?, ?, ?)`,
    [generateId(), mission2Id, assetIds[5]]
  );
  
  const report1Id = generateId();
  const report2Id = generateId();
  
  await db.runAsync(
    `INSERT INTO reports (id, mission_id, asset_id, performed_at, performer, conclusion, summary, signed_by_name, signed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [report1Id, mission1Id, assetIds[0], formatDate(addDays(now, -30)), userId1, 'CONFORME', 'Équipement en bon état général. Tous les tests satisfaisants.', 'Jean Dupont', formatDate(addDays(now, -30)), formatDate(addDays(now, -30))]
  );
  
  await db.runAsync(
    `INSERT INTO reports (id, mission_id, asset_id, performed_at, performer, conclusion, summary, signed_by_name, signed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [report2Id, mission1Id, assetIds[1], formatDate(addDays(now, -30)), userId1, 'NON_CONFORME', 'Usure anormale des câbles détectée. Remplacement nécessaire.', 'Jean Dupont', formatDate(addDays(now, -30)), formatDate(addDays(now, -30))]
  );
  
  const ncId = generateId();
  
  await db.runAsync(
    `INSERT INTO nonconformities (id, report_id, asset_id, title, description, severity, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [ncId, report2Id, assetIds[1], 'Usure câbles chariot CHE-002', 'Câbles de levage présentant une usure supérieure aux tolérances. Fils cassés visibles sur plusieurs brins. Remplacement urgent requis.', 4, 'OUVERTE', formatDate(addDays(now, -30))]
  );
  
  const actionId = generateId();
  
  await db.runAsync(
    `INSERT INTO corrective_actions (id, nonconformity_id, owner, description, due_at, status, closed_at, validated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [actionId, ncId, userId1, 'Commander et remplacer les câbles de levage. Prévoir immobilisation équipement pendant intervention.', formatDate(addDays(now, 15)), 'EN_COURS', null, null]
  );
  
  await db.runAsync(
    `INSERT INTO maintenance_logs (id, asset_id, date, actor, operation_type, description, parts_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), assetIds[0], formatDate(addDays(now, -60)), 'Jean Dupont', 'MAINTENANCE', 'Vidange huile hydraulique et remplacement filtres', 'FIL-HYD-001, HUILE-H46', formatDate(addDays(now, -60))]
  );
  
  await db.runAsync(
    `INSERT INTO maintenance_logs (id, asset_id, date, actor, operation_type, description, parts_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), assetIds[2], formatDate(addDays(now, -45)), 'Technicien externe', 'INSPECTION', 'Inspection annuelle pont roulant - contrôle structure et mécanismes', null, formatDate(addDays(now, -45))]
  );
  
  console.log('[SEED] Database seeded successfully');
}
