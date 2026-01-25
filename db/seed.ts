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

const clientsData = [
  { name: 'Carrefour Logistique Lyon', address: '123 Rue de l\'Industrie, 69000 Lyon' },
  { name: 'Amazon Fulfilment Satolas', address: '45 Zone Industrielle Est, 69125 Lyon-Saint-Exupéry' },
  { name: 'Michelin Clermont-Ferrand', address: '12 Place des Carmes, 63000 Clermont-Ferrand' },
  { name: 'Renault Trucks Vénissieux', address: '99 Route de Lyon, 69200 Vénissieux' },
  { name: 'Sanofi Marcy-l\'Étoile', address: '1546 Chemin de Sanofi, 69280 Marcy-l\'Étoile' },
  { name: 'LDLC Limonest', address: '2 Rue des Érables, 69760 Limonest' },
  { name: 'Saint-Gobain Distribution', address: '78 Avenue Jean Jaurès, 69007 Lyon' },
  { name: 'Geodis Corbas', address: '15 Rue de la Logistique, 69960 Corbas' },
  { name: 'Bosch Rexroth Vénissieux', address: '64 Rue Yves Farge, 69200 Vénissieux' },
  { name: 'FM Logistic Fos-sur-Mer', address: '200 Zone Portuaire, 13270 Fos-sur-Mer' },
];

const zonesData = [
  ['Zone A - Production', 'Zone B - Stockage'],
  ['Réception', 'Expédition', 'Picking'],
  ['Atelier Nord', 'Atelier Sud', 'Magasin'],
  ['Chaîne Montage', 'Logistique Interne'],
  ['Laboratoire', 'Production', 'Conditionnement'],
  ['Entrepôt Principal', 'Quai Chargement'],
  ['Dépôt Matériaux', 'Zone Découpe'],
  ['Cross-Dock', 'Stockage Masse', 'Préparation'],
  ['Assemblage', 'Tests', 'Expédition'],
  ['Terminal A', 'Terminal B', 'Zone Conteneurs'],
];

const assetsTemplates = [
  { prefix: 'CHE', designation: 'Chariot élévateur', categorie: 'Chariot élévateur', marques: ['Jungheinrich', 'Toyota', 'Linde', 'Still', 'Yale'], modeles: ['EFG 216', '8FBE15', 'E16', 'RX20', 'ERP16'] },
  { prefix: 'PON', designation: 'Pont roulant', categorie: 'Pont roulant', marques: ['Demag', 'Verlinde', 'Konecranes', 'Abus'], modeles: ['EKDR 5', 'Eurochain', 'CXT', 'GM6000'] },
  { prefix: 'GER', designation: 'Gerbeur électrique', categorie: 'Gerbeur', marques: ['Linde', 'Toyota', 'Jungheinrich', 'Crown'], modeles: ['L14', 'SWE120', 'EJC 214', 'WP 3020'] },
  { prefix: 'TRP', designation: 'Transpalette électrique', categorie: 'Transpalette', marques: ['BT', 'Linde', 'Toyota', 'Hyster'], modeles: ['LWE200', 'T20', 'LWE160', 'P2.0'] },
  { prefix: 'GRU', designation: 'Grue mobile', categorie: 'Grue mobile', marques: ['Liebherr', 'Tadano', 'Grove', 'Terex'], modeles: ['LTM 1030', 'ATF 40G', 'GMK 3050', 'AC 40'] },
  { prefix: 'NAC', designation: 'Nacelle élévatrice', categorie: 'Nacelle', marques: ['JLG', 'Haulotte', 'Genie', 'Manitou'], modeles: ['450AJ', 'Compact 10', 'GS-2669', 'MT 1440'] },
  { prefix: 'TRE', designation: 'Treuil électrique', categorie: 'Treuil', marques: ['Verlinde', 'Yale', 'Demag', 'Pfaff'], modeles: ['Eurochain VL5', 'CPE', 'DC-Pro', 'SWF'] },
  { prefix: 'PAL', designation: 'Gerbeur manuel', categorie: 'Gerbeur manuel', marques: ['Pramac', 'Logitrans', 'Lift-Rite', 'Bishamon'], modeles: ['GX12/29', 'HS1006', 'LR-20', 'BS-55'] },
  { prefix: 'HAY', designation: 'Hayon élévateur', categorie: 'Hayon', marques: ['Dhollandia', 'Palfinger', 'Bär', 'Anteo'], modeles: ['DH-LM.15', 'MBB C1500', 'BC2000', 'F3CL'] },
  { prefix: 'CIS', designation: 'Nacelle ciseaux', categorie: 'Nacelle ciseaux', marques: ['Skyjack', 'Genie', 'Haulotte', 'JLG'], modeles: ['SJ3219', 'GS-1930', 'Optimum 8', '1930ES'] },
];

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
  
  // Users
  const userId1 = generateId();
  const userId2 = generateId();
  const userId3 = generateId();
  
  await db.runAsync(
    `INSERT INTO users (id, email, name, role, token_mock, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId1, 'technicien@inspectra.fr', 'Jean Dupont', 'TECHNICIAN', 'mock_token_tech_123', formatDate(now)]
  );
  
  await db.runAsync(
    `INSERT INTO users (id, email, name, role, token_mock, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId2, 'hse@inspectra.fr', 'Marie Martin', 'HSE_MANAGER', 'mock_token_hse_456', formatDate(now)]
  );

  await db.runAsync(
    `INSERT INTO users (id, email, name, role, token_mock, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId3, 'admin@inspectra.fr', 'Pierre Administrateur', 'ADMIN', 'mock_token_admin_789', formatDate(now)]
  );
  
  // Control Types
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

  const controlTypes = [ctVGP, ctVGPRenforce, ctRemiseEnService];
  
  // Checklist Templates
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

  const vgpItemIds: string[] = [];
  
  for (let i = 0; i < vgpItems.length; i++) {
    const itemId = generateId();
    vgpItemIds.push(itemId);
    await db.runAsync(
      `INSERT INTO checklist_items (id, template_id, label, field_type, required, help_text, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [itemId, templateVGP, vgpItems[i].label, vgpItems[i].type, vgpItems[i].type !== 'TEXT' ? 1 : 0, vgpItems[i].help, i + 1]
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
  
  // Create 10 sites (clients) with zones and assets
  const allAssetIds: string[] = [];
  const siteIds: string[] = [];
  const assetsBySite: Record<string, string[]> = {};
  
  for (let siteIndex = 0; siteIndex < clientsData.length; siteIndex++) {
    const client = clientsData[siteIndex];
    const siteId = generateId();
    siteIds.push(siteId);
    assetsBySite[siteId] = [];
    
    await db.runAsync(
      `INSERT INTO sites (id, name, address, created_at) VALUES (?, ?, ?, ?)`,
      [siteId, client.name, client.address, formatDate(now)]
    );
    
    // Create zones for this site
    const siteZones = zonesData[siteIndex];
    const zoneIds: string[] = [];
    
    for (const zoneName of siteZones) {
      const zoneId = generateId();
      zoneIds.push(zoneId);
      await db.runAsync(
        `INSERT INTO zones (id, site_id, name) VALUES (?, ?, ?)`,
        [zoneId, siteId, zoneName]
      );
    }
    
    // Create 10 assets per site
    for (let assetIndex = 0; assetIndex < 10; assetIndex++) {
      const template = assetsTemplates[assetIndex % assetsTemplates.length];
      const marqueIndex = Math.floor(Math.random() * template.marques.length);
      const modeleIndex = Math.floor(Math.random() * template.modeles.length);
      const zoneId = zoneIds[Math.floor(Math.random() * zoneIds.length)];
      const annee = 2018 + Math.floor(Math.random() * 7); // 2018-2024
      const criticite = Math.floor(Math.random() * 5) + 1;
      const daysOffset = Math.floor(Math.random() * 400) - 60; // -60 to +340 days
      
      const assetId = generateId();
      allAssetIds.push(assetId);
      assetsBySite[siteId].push(assetId);
      
      const code = `${template.prefix}-${String(siteIndex + 1).padStart(2, '0')}${String(assetIndex + 1).padStart(2, '0')}`;
      const designation = `${template.designation} ${template.marques[marqueIndex]} ${template.modeles[modeleIndex]}`;
      const serie = `${template.prefix.substring(0, 2)}${annee}${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`;
      
      const miseEnService = addDays(now, -365 * (now.getFullYear() - annee));
      
      await db.runAsync(
        `INSERT INTO assets (id, code_interne, designation, categorie, marque, modele, numero_serie, annee, statut, criticite, site_id, zone_id, mise_en_service, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [assetId, code, designation, template.categorie, template.marques[marqueIndex], template.modeles[modeleIndex], serie, annee, 'EN_SERVICE', criticite, siteId, zoneId, formatDate(miseEnService), formatDate(now)]
      );
      
      // Create asset control (VGP périodique)
      const acId = generateId();
      const nextDue = addDays(now, daysOffset);
      const lastDone = addDays(nextDue, -365);
      
      await db.runAsync(
        `INSERT INTO asset_controls (id, asset_id, control_type_id, start_date, last_done_at, next_due_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [acId, assetId, ctVGP, formatDate(lastDone), formatDate(lastDone), formatDate(nextDue)]
      );
    }
  }
  
  // Create missions and reports
  const conclusions: Array<'CONFORME' | 'NON_CONFORME' | 'CONFORME_SOUS_RESERVE'> = ['CONFORME', 'NON_CONFORME', 'CONFORME_SOUS_RESERVE'];
  const summaries = {
    'CONFORME': [
      'Équipement en bon état général. Tous les tests satisfaisants.',
      'Contrôle effectué sans anomalie. Équipement conforme aux normes en vigueur.',
      'Vérification complète réalisée. Aucune non-conformité détectée.',
      'Appareil en parfait état de fonctionnement. Tous les dispositifs de sécurité opérationnels.',
    ],
    'NON_CONFORME': [
      'Usure anormale des câbles détectée. Remplacement nécessaire.',
      'Défaut du système de freinage constaté. Arrêt immédiat recommandé.',
      'Fuite hydraulique importante. Réparation urgente requise.',
      'Dispositif de sécurité défaillant. Mise hors service jusqu\'à réparation.',
    ],
    'CONFORME_SOUS_RESERVE': [
      'Équipement globalement conforme. Usure légère à surveiller lors du prochain contrôle.',
      'Fonctionnement correct mais recommandation de maintenance préventive sous 30 jours.',
      'Conformité validée sous réserve de remplacement des joints sous 2 semaines.',
      'Équipement opérationnel. Points de vigilance signalés pour surveillance accrue.',
    ],
  };

  const ncTitles = [
    'Usure câbles',
    'Fuite hydraulique',
    'Défaut freinage',
    'Corrosion structure',
    'Dispositif sécurité HS',
    'Éclairage défaillant',
    'Commandes usées',
    'Marquage effacé',
  ];

  const ncDescriptions = [
    'Câbles de levage présentant une usure supérieure aux tolérances. Fils cassés visibles.',
    'Fuite détectée sur le circuit hydraulique principal. Traces d\'huile au sol.',
    'Système de freinage ne répond pas correctement. Temps de réponse excessif.',
    'Corrosion importante sur la structure porteuse. Points de rouille multiples.',
    'Dispositif de fin de course non fonctionnel. Risque de dépassement de course.',
    'Éclairage de travail défaillant. Visibilité réduite pour l\'opérateur.',
    'Commandes manuelles usées. Jeu excessif sur les leviers.',
    'Marquages de charge et sécurité effacés ou illisibles.',
  ];

  // Create completed missions with reports (30 missions completed in the past)
  for (let i = 0; i < 30; i++) {
    const missionId = generateId();
    const siteId = siteIds[Math.floor(Math.random() * siteIds.length)];
    const siteAssets = assetsBySite[siteId];
    const daysAgo = Math.floor(Math.random() * 180) + 10; // 10 to 190 days ago
    const scheduledAt = addDays(now, -daysAgo);
    
    await db.runAsync(
      `INSERT INTO missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [missionId, ctVGP, formatDate(scheduledAt), userId1, 'TERMINEE', siteId, formatDate(addDays(scheduledAt, -5))]
    );
    
    // Add 2-4 assets to this mission
    const numAssets = Math.floor(Math.random() * 3) + 2;
    const selectedAssets = [...siteAssets].sort(() => Math.random() - 0.5).slice(0, numAssets);
    
    for (const assetId of selectedAssets) {
      await db.runAsync(
        `INSERT INTO mission_assets (id, mission_id, asset_id) VALUES (?, ?, ?)`,
        [generateId(), missionId, assetId]
      );
      
      // Create report for this asset
      const reportId = generateId();
      const conclusionIndex = Math.random() < 0.7 ? 0 : (Math.random() < 0.5 ? 1 : 2); // 70% conforme
      const conclusion = conclusions[conclusionIndex];
      const summaryList = summaries[conclusion];
      const summary = summaryList[Math.floor(Math.random() * summaryList.length)];
      
      await db.runAsync(
        `INSERT INTO reports (id, mission_id, asset_id, performed_at, performer, conclusion, summary, signed_by_name, signed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [reportId, missionId, assetId, formatDate(scheduledAt), userId1, conclusion, summary, 'Jean Dupont', formatDate(scheduledAt), formatDate(scheduledAt)]
      );

      // Add report items (checklist results)
      for (let itemIndex = 0; itemIndex < vgpItemIds.length; itemIndex++) {
        const itemId = vgpItemIds[itemIndex];
        const vgpItem = vgpItems[itemIndex];
        let status: 'OK' | 'KO' | 'NA' = 'OK';
        let valueNum: number | null = null;
        let valueText: string | null = null;

        if (conclusion === 'NON_CONFORME' && itemIndex < 6 && Math.random() < 0.3) {
          status = 'KO';
        } else if (conclusion === 'CONFORME_SOUS_RESERVE' && itemIndex < 6 && Math.random() < 0.15) {
          status = 'KO';
        }

        if (vgpItem.type === 'NUM') {
          if (vgpItem.label.includes('Pression')) {
            valueNum = 150 + Math.floor(Math.random() * 100);
          } else if (vgpItem.label.includes('Charge')) {
            valueNum = 1000 + Math.floor(Math.random() * 4000);
          }
        } else if (vgpItem.type === 'TEXT') {
          valueText = status === 'OK' ? 'RAS' : 'Point de vigilance noté';
        }

        await db.runAsync(
          `INSERT INTO report_item_results (id, report_id, checklist_item_id, status, value_num, value_text, comment) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [generateId(), reportId, itemId, status, valueNum, valueText, null]
        );
      }
      
      // Create NC if non-conforme
      if (conclusion === 'NON_CONFORME') {
        const ncId = generateId();
        const ncIndex = Math.floor(Math.random() * ncTitles.length);
        const severity = Math.floor(Math.random() * 3) + 3; // 3-5
        const ncStatus = Math.random() < 0.3 ? 'CLOTUREE' : (Math.random() < 0.5 ? 'EN_COURS' : 'OUVERTE');
        
        await db.runAsync(
          `INSERT INTO nonconformities (id, report_id, asset_id, title, description, severity, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [ncId, reportId, assetId, ncTitles[ncIndex], ncDescriptions[ncIndex], severity, ncStatus, formatDate(scheduledAt)]
        );
        
        // Create corrective action
        const actionId = generateId();
        const actionStatus = ncStatus === 'CLOTUREE' ? 'VALIDEE' : (ncStatus === 'EN_COURS' ? 'EN_COURS' : 'OUVERTE');
        const dueAt = addDays(scheduledAt, 30);
        const closedAt = actionStatus === 'VALIDEE' ? addDays(scheduledAt, 20) : null;
        
        await db.runAsync(
          `INSERT INTO corrective_actions (id, nonconformity_id, owner, description, due_at, status, closed_at, validated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [actionId, ncId, userId1, 'Intervention de maintenance corrective programmée', formatDate(dueAt), actionStatus, closedAt ? formatDate(closedAt) : null, actionStatus === 'VALIDEE' ? userId2 : null]
        );
      }
    }
  }
  
  // Create planned missions (future)
  for (let i = 0; i < 15; i++) {
    const missionId = generateId();
    const siteId = siteIds[Math.floor(Math.random() * siteIds.length)];
    const siteAssets = assetsBySite[siteId];
    const daysAhead = Math.floor(Math.random() * 60) + 1; // 1 to 60 days ahead
    const scheduledAt = addDays(now, daysAhead);
    const controlType = controlTypes[Math.floor(Math.random() * 2)]; // VGP or VGP Renforcé
    
    await db.runAsync(
      `INSERT INTO missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [missionId, controlType, formatDate(scheduledAt), userId1, 'PLANIFIEE', siteId, formatDate(now)]
    );
    
    // Add 2-5 assets to this mission
    const numAssets = Math.floor(Math.random() * 4) + 2;
    const selectedAssets = [...siteAssets].sort(() => Math.random() - 0.5).slice(0, numAssets);
    
    for (const assetId of selectedAssets) {
      await db.runAsync(
        `INSERT INTO mission_assets (id, mission_id, asset_id) VALUES (?, ?, ?)`,
        [generateId(), missionId, assetId]
      );
    }
  }

  // Create missions in progress (2-3)
  for (let i = 0; i < 3; i++) {
    const missionId = generateId();
    const siteId = siteIds[i % siteIds.length];
    const siteAssets = assetsBySite[siteId];
    const scheduledAt = addDays(now, -i);
    
    await db.runAsync(
      `INSERT INTO missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [missionId, ctVGP, formatDate(scheduledAt), userId1, 'EN_COURS', siteId, formatDate(addDays(scheduledAt, -3))]
    );
    
    const numAssets = Math.floor(Math.random() * 3) + 2;
    const selectedAssets = [...siteAssets].sort(() => Math.random() - 0.5).slice(0, numAssets);
    
    for (const assetId of selectedAssets) {
      await db.runAsync(
        `INSERT INTO mission_assets (id, mission_id, asset_id) VALUES (?, ?, ?)`,
        [generateId(), missionId, assetId]
      );
    }
  }
  
  // Add maintenance logs
  const maintenanceTypes: Array<'MAINTENANCE' | 'INSPECTION' | 'REPARATION' | 'MODIFICATION'> = ['MAINTENANCE', 'INSPECTION', 'REPARATION', 'MODIFICATION'];
  const maintenanceDescriptions = [
    'Vidange huile hydraulique et remplacement filtres',
    'Graissage général des points de lubrification',
    'Remplacement des câbles de levage',
    'Contrôle et réglage des freins',
    'Vérification système électrique',
    'Remplacement batteries',
    'Changement pneus/roues',
    'Réparation fuite hydraulique',
    'Mise à jour logiciel embarqué',
    'Remplacement capteurs de sécurité',
  ];
  
  for (let i = 0; i < 50; i++) {
    const assetId = allAssetIds[Math.floor(Math.random() * allAssetIds.length)];
    const daysAgo = Math.floor(Math.random() * 365) + 1;
    const maintenanceDate = addDays(now, -daysAgo);
    const opType = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
    const description = maintenanceDescriptions[Math.floor(Math.random() * maintenanceDescriptions.length)];
    const actor = Math.random() < 0.7 ? 'Jean Dupont' : 'Technicien externe';
    const partsRef = Math.random() < 0.5 ? `REF-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}` : null;
    
    await db.runAsync(
      `INSERT INTO maintenance_logs (id, asset_id, date, actor, operation_type, description, parts_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), assetId, formatDate(maintenanceDate), actor, opType, description, partsRef, formatDate(maintenanceDate)]
    );
  }
  
  console.log('[SEED] Database seeded successfully with:');
  console.log('[SEED] - 3 users');
  console.log('[SEED] - 10 clients/sites');
  console.log('[SEED] - 100 assets (10 per client)');
  console.log('[SEED] - 30 completed missions with reports');
  console.log('[SEED] - 15 planned missions');
  console.log('[SEED] - 3 missions in progress');
  console.log('[SEED] - Multiple non-conformities with corrective actions');
  console.log('[SEED] - 50 maintenance logs');
}
