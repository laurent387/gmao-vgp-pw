import { Asset, Site, Zone, Mission, NonConformity, Report, MaintenanceLog, ControlType, CorrectiveAction, AssetStatus, SeverityLevel, NCStatus, ActionStatus, ControlConclusion, OperationType } from '@/types';

function formatDate(date: Date): string {
  return date.toISOString();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const now = new Date();

// Users
export const mockUsers = [
  { id: 'user1', email: 'technicien@inspectra.fr', name: 'Jean Dupont', role: 'TECHNICIAN' as const, created_at: formatDate(now) },
  { id: 'user2', email: 'hse@inspectra.fr', name: 'Marie Martin', role: 'HSE_MANAGER' as const, created_at: formatDate(now) },
  { id: 'user3', email: 'admin@inspectra.fr', name: 'Pierre Administrateur', role: 'ADMIN' as const, created_at: formatDate(now) },
];

// Control Types
export const mockControlTypes: ControlType[] = [
  { id: 'ct1', code: 'VGP_PERIODIQUE', label: 'VGP Périodique', description: 'Vérification Générale Périodique annuelle', periodicity_days: 365, active: true },
  { id: 'ct2', code: 'VGP_RENFORCE', label: 'VGP Renforcée', description: 'VGP semestrielle pour équipements à usage intensif', periodicity_days: 180, active: true },
  { id: 'ct3', code: 'REMISE_SERVICE', label: 'Remise en Service', description: 'Vérification avant remise en service après arrêt prolongé', periodicity_days: 0, active: true },
];

// Sites (Clients)
export const mockSites: Site[] = [
  { id: 'site1', name: 'Carrefour Logistique Lyon', address: '123 Rue de l\'Industrie, 69000 Lyon', created_at: formatDate(now) },
  { id: 'site2', name: 'Amazon Fulfilment Satolas', address: '45 Zone Industrielle Est, 69125 Lyon-Saint-Exupéry', created_at: formatDate(now) },
  { id: 'site3', name: 'Michelin Clermont-Ferrand', address: '12 Place des Carmes, 63000 Clermont-Ferrand', created_at: formatDate(now) },
  { id: 'site4', name: 'Renault Trucks Vénissieux', address: '99 Route de Lyon, 69200 Vénissieux', created_at: formatDate(now) },
  { id: 'site5', name: 'Sanofi Marcy-l\'Étoile', address: '1546 Chemin de Sanofi, 69280 Marcy-l\'Étoile', created_at: formatDate(now) },
  { id: 'site6', name: 'LDLC Limonest', address: '2 Rue des Érables, 69760 Limonest', created_at: formatDate(now) },
  { id: 'site7', name: 'Saint-Gobain Distribution', address: '78 Avenue Jean Jaurès, 69007 Lyon', created_at: formatDate(now) },
  { id: 'site8', name: 'Geodis Corbas', address: '15 Rue de la Logistique, 69960 Corbas', created_at: formatDate(now) },
  { id: 'site9', name: 'Bosch Rexroth Vénissieux', address: '64 Rue Yves Farge, 69200 Vénissieux', created_at: formatDate(now) },
  { id: 'site10', name: 'FM Logistic Fos-sur-Mer', address: '200 Zone Portuaire, 13270 Fos-sur-Mer', created_at: formatDate(now) },
];

// Zones
export const mockZones: Zone[] = [
  { id: 'zone1', site_id: 'site1', name: 'Zone A - Production' },
  { id: 'zone2', site_id: 'site1', name: 'Zone B - Stockage' },
  { id: 'zone3', site_id: 'site2', name: 'Réception' },
  { id: 'zone4', site_id: 'site2', name: 'Expédition' },
  { id: 'zone5', site_id: 'site2', name: 'Picking' },
  { id: 'zone6', site_id: 'site3', name: 'Atelier Nord' },
  { id: 'zone7', site_id: 'site3', name: 'Atelier Sud' },
  { id: 'zone8', site_id: 'site4', name: 'Chaîne Montage' },
  { id: 'zone9', site_id: 'site4', name: 'Logistique Interne' },
  { id: 'zone10', site_id: 'site5', name: 'Laboratoire' },
  { id: 'zone11', site_id: 'site5', name: 'Production' },
  { id: 'zone12', site_id: 'site6', name: 'Entrepôt Principal' },
  { id: 'zone13', site_id: 'site7', name: 'Dépôt Matériaux' },
  { id: 'zone14', site_id: 'site8', name: 'Cross-Dock' },
  { id: 'zone15', site_id: 'site9', name: 'Assemblage' },
  { id: 'zone16', site_id: 'site10', name: 'Terminal A' },
];

interface MockMission extends Mission {
  control_type_label?: string;
  asset_count?: number;
}

interface MockNonConformity extends NonConformity {
  asset_code?: string;
  asset_designation?: string;
  site_name?: string;
}

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

// Generate 100 assets (10 per site)
function generateAssets(): Asset[] {
  const assets: Asset[] = [];
  const siteZoneMap: Record<string, string[]> = {
    'site1': ['zone1', 'zone2'],
    'site2': ['zone3', 'zone4', 'zone5'],
    'site3': ['zone6', 'zone7'],
    'site4': ['zone8', 'zone9'],
    'site5': ['zone10', 'zone11'],
    'site6': ['zone12'],
    'site7': ['zone13'],
    'site8': ['zone14'],
    'site9': ['zone15'],
    'site10': ['zone16'],
  };

  for (let siteIndex = 0; siteIndex < 10; siteIndex++) {
    const siteId = `site${siteIndex + 1}`;
    const site = mockSites[siteIndex];
    const zoneIds = siteZoneMap[siteId] || ['zone1'];

    for (let assetIndex = 0; assetIndex < 10; assetIndex++) {
      const template = assetsTemplates[assetIndex % assetsTemplates.length];
      const marqueIndex = Math.floor(Math.random() * template.marques.length);
      const modeleIndex = Math.floor(Math.random() * template.modeles.length);
      const zoneId = zoneIds[Math.floor(Math.random() * zoneIds.length)];
      const zone = mockZones.find(z => z.id === zoneId);
      const annee = 2018 + Math.floor(Math.random() * 7);
      const criticite = (Math.floor(Math.random() * 5) + 1) as SeverityLevel;
      const daysOffset = Math.floor(Math.random() * 400) - 60;

      const code = `${template.prefix}-${String(siteIndex + 1).padStart(2, '0')}${String(assetIndex + 1).padStart(2, '0')}`;
      const designation = `${template.designation} ${template.marques[marqueIndex]} ${template.modeles[modeleIndex]}`;
      const serie = `${template.prefix.substring(0, 2)}${annee}${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`;

      const statuts: AssetStatus[] = ['EN_SERVICE', 'EN_SERVICE', 'EN_SERVICE', 'EN_SERVICE', 'EN_SERVICE', 'EN_SERVICE', 'EN_SERVICE', 'HORS_SERVICE', 'REBUT', 'EN_LOCATION'];
      const statut = statuts[Math.floor(Math.random() * statuts.length)];

      const miseEnService = addDays(now, -365 * (now.getFullYear() - annee));
      const nextDue = addDays(now, daysOffset);

      assets.push({
        id: `asset${siteIndex * 10 + assetIndex + 1}`,
        code_interne: code,
        designation,
        categorie: template.categorie,
        marque: template.marques[marqueIndex],
        modele: template.modeles[modeleIndex],
        numero_serie: serie,
        annee,
        statut,
        criticite,
        site_id: siteId,
        zone_id: zoneId,
        mise_en_service: formatDate(miseEnService),
        created_at: formatDate(now),
        site_name: site.name,
        zone_name: zone?.name || 'Zone inconnue',
        next_due_at: formatDate(nextDue),
        is_overdue: daysOffset < 0,
      });
    }
  }

  return assets;
}

export const mockAssets: Asset[] = generateAssets();

// Missions
function generateMissions(): MockMission[] {
  const missions: MockMission[] = [];

  // Completed missions
  for (let i = 0; i < 30; i++) {
    const siteIndex = Math.floor(Math.random() * 10);
    const siteId = `site${siteIndex + 1}`;
    const site = mockSites[siteIndex];
    const daysAgo = Math.floor(Math.random() * 180) + 10;
    const scheduledAt = addDays(now, -daysAgo);

    missions.push({
      id: `mission${i + 1}`,
      control_type_id: 'ct1',
      scheduled_at: formatDate(scheduledAt),
      assigned_to: 'user1',
      status: 'TERMINEE',
      site_id: siteId,
      created_at: formatDate(addDays(scheduledAt, -5)),
      site_name: site.name,
      control_type_label: 'VGP Périodique',
      assigned_to_name: 'Jean Dupont',
      asset_count: Math.floor(Math.random() * 3) + 2,
    });
  }

  // Planned missions
  for (let i = 0; i < 15; i++) {
    const siteIndex = Math.floor(Math.random() * 10);
    const siteId = `site${siteIndex + 1}`;
    const site = mockSites[siteIndex];
    const daysAhead = Math.floor(Math.random() * 60) + 1;
    const scheduledAt = addDays(now, daysAhead);
    const ctIndex = Math.floor(Math.random() * 2);

    missions.push({
      id: `mission${30 + i + 1}`,
      control_type_id: `ct${ctIndex + 1}`,
      scheduled_at: formatDate(scheduledAt),
      assigned_to: 'user1',
      status: 'PLANIFIEE',
      site_id: siteId,
      created_at: formatDate(now),
      site_name: site.name,
      control_type_label: mockControlTypes[ctIndex].label,
      assigned_to_name: 'Jean Dupont',
      asset_count: Math.floor(Math.random() * 4) + 2,
    });
  }

  // In progress missions
  for (let i = 0; i < 3; i++) {
    const siteId = `site${i + 1}`;
    const site = mockSites[i];
    const scheduledAt = addDays(now, -i);

    missions.push({
      id: `mission${45 + i + 1}`,
      control_type_id: 'ct1',
      scheduled_at: formatDate(scheduledAt),
      assigned_to: 'user1',
      status: 'EN_COURS',
      site_id: siteId,
      created_at: formatDate(addDays(scheduledAt, -3)),
      site_name: site.name,
      control_type_label: 'VGP Périodique',
      assigned_to_name: 'Jean Dupont',
      asset_count: Math.floor(Math.random() * 3) + 2,
    });
  }

  return missions;
}

export const mockMissions: MockMission[] = generateMissions();

// Non-conformities
const ncTitles = ['Usure câbles', 'Fuite hydraulique', 'Défaut freinage', 'Corrosion structure', 'Dispositif sécurité HS', 'Éclairage défaillant', 'Commandes usées', 'Marquage effacé'];
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

function generateNonConformities(): MockNonConformity[] {
  const ncs: MockNonConformity[] = [];
  const statuses: NCStatus[] = ['OUVERTE', 'EN_COURS', 'CLOTUREE'];

  for (let i = 0; i < 25; i++) {
    const assetIndex = Math.floor(Math.random() * 100);
    const asset = mockAssets[assetIndex];
    const ncIndex = Math.floor(Math.random() * ncTitles.length);
    const daysAgo = Math.floor(Math.random() * 90) + 5;
    const severity = (Math.floor(Math.random() * 3) + 3) as SeverityLevel;
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    ncs.push({
      id: `nc${i + 1}`,
      report_id: `report${Math.floor(Math.random() * 30) + 1}`,
      asset_id: asset.id,
      checklist_item_id: null,
      title: ncTitles[ncIndex],
      description: ncDescriptions[ncIndex],
      severity,
      status,
      created_at: formatDate(addDays(now, -daysAgo)),
      asset_code: asset.code_interne,
      asset_designation: asset.designation,
      site_name: asset.site_name,
    });
  }

  return ncs;
}

export const mockNonConformities: MockNonConformity[] = generateNonConformities();

// Corrective Actions
function generateCorrectiveActions(): CorrectiveAction[] {
  const actions: CorrectiveAction[] = [];
  const statuses: ActionStatus[] = ['OUVERTE', 'EN_COURS', 'VALIDEE'];

  for (let i = 0; i < mockNonConformities.length; i++) {
    const nc = mockNonConformities[i];
    const daysAgo = Math.floor(Math.random() * 60) + 10;
    const status = nc.status === 'CLOTUREE' ? 'VALIDEE' : statuses[Math.floor(Math.random() * 2)];

    actions.push({
      id: `action${i + 1}`,
      nonconformity_id: nc.id,
      owner: 'user1',
      description: 'Intervention de maintenance corrective programmée',
      due_at: formatDate(addDays(now, -daysAgo + 30)),
      status,
      closed_at: status === 'VALIDEE' ? formatDate(addDays(now, -daysAgo + 20)) : null,
      validated_by: status === 'VALIDEE' ? 'user2' : null,
    });
  }

  return actions;
}

export const mockCorrectiveActions: CorrectiveAction[] = generateCorrectiveActions();

// Reports
function generateReports(): Report[] {
  const reports: Report[] = [];
  const conclusions: ControlConclusion[] = ['CONFORME', 'NON_CONFORME', 'CONFORME_SOUS_RESERVE'];
  const summaries = {
    'CONFORME': 'Équipement en bon état général. Tous les tests satisfaisants.',
    'NON_CONFORME': 'Défaut constaté. Intervention corrective requise.',
    'CONFORME_SOUS_RESERVE': 'Équipement globalement conforme. Points de vigilance signalés.',
  };

  for (let i = 0; i < 60; i++) {
    const missionIndex = Math.min(i % 30, 29);
    const mission = mockMissions[missionIndex];
    const assetIndex = Math.floor(Math.random() * 100);
    const asset = mockAssets[assetIndex];
    const conclusionIndex = Math.random() < 0.7 ? 0 : (Math.random() < 0.5 ? 1 : 2);
    const conclusion = conclusions[conclusionIndex];

    reports.push({
      id: `report${i + 1}`,
      mission_id: mission.id,
      asset_id: asset.id,
      performed_at: mission.scheduled_at,
      performer: 'user1',
      conclusion,
      summary: summaries[conclusion],
      signed_by_name: 'Jean Dupont',
      signed_at: mission.scheduled_at,
      created_at: mission.scheduled_at,
    });
  }

  return reports;
}

export const mockReports: Report[] = generateReports();

// Maintenance Logs
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

function generateMaintenanceLogs(): MaintenanceLog[] {
  const logs: MaintenanceLog[] = [];
  const types: OperationType[] = ['MAINTENANCE', 'INSPECTION', 'REPARATION', 'MODIFICATION'];

  for (let i = 0; i < 50; i++) {
    const assetIndex = Math.floor(Math.random() * 100);
    const asset = mockAssets[assetIndex];
    const daysAgo = Math.floor(Math.random() * 365) + 1;
    const opType = types[Math.floor(Math.random() * types.length)];

    logs.push({
      id: `log${i + 1}`,
      asset_id: asset.id,
      date: formatDate(addDays(now, -daysAgo)),
      actor: Math.random() < 0.7 ? 'Jean Dupont' : 'Technicien externe',
      operation_type: opType,
      description: maintenanceDescriptions[Math.floor(Math.random() * maintenanceDescriptions.length)],
      parts_ref: Math.random() < 0.5 ? `REF-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}` : null,
      created_at: formatDate(addDays(now, -daysAgo)),
    });
  }

  return logs;
}

export const mockMaintenanceLogs: MaintenanceLog[] = generateMaintenanceLogs();

// Dashboard stats
export const mockDashboardStats = {
  totalAssets: mockAssets.length,
  overdueAssets: mockAssets.filter(a => a.is_overdue).length,
  dueSoon: mockAssets.filter(a => {
    if (!a.next_due_at) return false;
    const dueDate = new Date(a.next_due_at);
    const diffDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length,
  openNCs: mockNonConformities.filter(nc => nc.status === 'OUVERTE').length,
  inProgressMissions: mockMissions.filter(m => m.status === 'EN_COURS').length,
  plannedMissions: mockMissions.filter(m => m.status === 'PLANIFIEE').length,
};

// Categories
export const mockCategories = [...new Set(mockAssets.map(a => a.categorie))].sort();
