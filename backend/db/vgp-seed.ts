// VGP Presses - Seed du template par défaut "VGP Presses Plieuses Hydrauliques"
import { pgQuery } from "./postgres";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

// Référentiel VGP Presses - 15 sections (A-O), 76 points de contrôle
const VGP_PRESSES_TEMPLATE = {
  name: "VGP Presses Plieuses Hydrauliques",
  machineType: "PRESS",
  referentiel: "Code du travail Art. R.4323-23 à R.4323-27",
  sections: [
    {
      code: "A",
      title: "Bâti et structure",
      items: [
        { numero: 1, label: "Bâti stable au sol", helpText: "Vérifier fixation et absence de jeu" },
        { numero: 2, label: "Absence de fissures ou déformations", helpText: null },
        { numero: 3, label: "État des soudures", helpText: "Contrôle visuel" },
        { numero: 4, label: "Tenue mécanique des assemblages boulonnés", helpText: null },
        { numero: 5, label: "État de la table et du tablier", helpText: null },
      ]
    },
    {
      code: "B",
      title: "Circuit hydraulique",
      items: [
        { numero: 6, label: "Niveau d'huile correct", helpText: "Vérifier jauge" },
        { numero: 7, label: "Absence de fuites", helpText: "Tuyaux, raccords, vérins" },
        { numero: 8, label: "État des flexibles", helpText: "Fissures, usure, pincement" },
        { numero: 9, label: "Filtres en bon état", helpText: null },
        { numero: 10, label: "Pression conforme", helpText: "Vérifier manomètre" },
      ]
    },
    {
      code: "C",
      title: "Commandes et organes de service",
      items: [
        { numero: 11, label: "Boutons et pédales fonctionnels", helpText: null },
        { numero: 12, label: "Sélecteur de mode opérationnel", helpText: "Réglage/Auto/Manuel" },
        { numero: 13, label: "Commande bi-manuelle fonctionnelle", helpText: "Si équipée" },
        { numero: 14, label: "Pédale protégée contre actionnement accidentel", helpText: null },
        { numero: 15, label: "Retour automatique à l'état neutre", helpText: null },
      ]
    },
    {
      code: "D",
      title: "Arrêts d'urgence",
      items: [
        { numero: 16, label: "Arrêt d'urgence accessible", helpText: "Vérifier positionnement" },
        { numero: 17, label: "Arrêt d'urgence fonctionne correctement", helpText: "Essai à vide" },
        { numero: 18, label: "Verrouillage après actionnement", helpText: "Nécessite action volontaire pour réarmer" },
        { numero: 19, label: "Signalisation correcte (rouge/jaune)", helpText: null },
        { numero: 20, label: "Tous les AU sont raccordés", helpText: null },
      ]
    },
    {
      code: "E",
      title: "Protections mécaniques fixes",
      items: [
        { numero: 21, label: "Carter latéraux en place", helpText: null },
        { numero: 22, label: "Protection arrière installée", helpText: null },
        { numero: 23, label: "Fixations solides", helpText: "Vis, boulons non desserrés" },
        { numero: 24, label: "Absence de zones de coincement accessibles", helpText: null },
      ]
    },
    {
      code: "F",
      title: "Protections mobiles avec inter-verrouillage",
      items: [
        { numero: 25, label: "Détecteur d'ouverture fonctionnel", helpText: "Essai ouverture porte" },
        { numero: 26, label: "Arrêt immédiat à l'ouverture du protecteur", helpText: null },
        { numero: 27, label: "Verrouillage interdit le démarrage porte ouverte", helpText: null },
        { numero: 28, label: "Indicateur d'état visible", helpText: null },
      ]
    },
    {
      code: "G",
      title: "Dispositifs optoélectroniques (barrières immatérielles)",
      items: [
        { numero: 29, label: "Barrière immatérielle présente et fonctionnelle", helpText: null },
        { numero: 30, label: "Résolution adaptée", helpText: "Doigt, main, corps selon distance" },
        { numero: 31, label: "Test muting si applicable", helpText: null },
        { numero: 32, label: "Indicateurs lumineux fonctionnels", helpText: null },
        { numero: 33, label: "Distance de sécurité respectée", helpText: "Calcul selon vitesse d'approche" },
      ]
    },
    {
      code: "H",
      title: "Systèmes de retenue mécanique (bloc de sécurité)",
      items: [
        { numero: 34, label: "Cale/Bloc de sécurité présent", helpText: null },
        { numero: 35, label: "État du bloc", helpText: "Usure, déformation" },
        { numero: 36, label: "Mise en place effective lors interventions", helpText: null },
      ]
    },
    {
      code: "I",
      title: "Éclairage et signalisation",
      items: [
        { numero: 37, label: "Éclairage zone de travail suffisant", helpText: null },
        { numero: 38, label: "Voyants de signalisation fonctionnels", helpText: null },
        { numero: 39, label: "Avertisseur sonore fonctionnel", helpText: "Si équipé" },
        { numero: 40, label: "Signalétique de danger visible", helpText: null },
      ]
    },
    {
      code: "J",
      title: "Installation électrique",
      items: [
        { numero: 41, label: "Coffret électrique fermé", helpText: null },
        { numero: 42, label: "Sectionneur accessible et verrouillable", helpText: null },
        { numero: 43, label: "Câblage en bon état", helpText: "Pas de fils dénudés ou écrasés" },
        { numero: 44, label: "Mise à la terre effective", helpText: null },
        { numero: 45, label: "Protection IP adaptée", helpText: null },
      ]
    },
    {
      code: "K",
      title: "Ergonomie et accessibilité",
      items: [
        { numero: 46, label: "Hauteur de travail adaptée", helpText: null },
        { numero: 47, label: "Accès aux commandes aisé", helpText: null },
        { numero: 48, label: "Efforts de manœuvre acceptables", helpText: null },
        { numero: 49, label: "Visibilité de la zone de travail", helpText: null },
        { numero: 50, label: "Sol antidérapant", helpText: "Zone de l'opérateur" },
      ]
    },
    {
      code: "L",
      title: "Documentation et marquage",
      items: [
        { numero: 51, label: "Plaque signalétique lisible", helpText: "Constructeur, modèle, n° série" },
        { numero: 52, label: "Marquage CE présent", helpText: null },
        { numero: 53, label: "Notice d'instructions disponible", helpText: null },
        { numero: 54, label: "Schémas électriques et hydrauliques", helpText: null },
        { numero: 55, label: "Registre de maintenance à jour", helpText: null },
      ]
    },
    {
      code: "M",
      title: "Maintenance et historique",
      items: [
        { numero: 56, label: "Carnet de maintenance existant", helpText: null },
        { numero: 57, label: "Dernière maintenance préventive datée", helpText: null },
        { numero: 58, label: "Actions correctives précédentes réalisées", helpText: null },
        { numero: 59, label: "Pièces de rechange conformes", helpText: null },
      ]
    },
    {
      code: "N",
      title: "Essais à vide",
      items: [
        { numero: 60, label: "Descente coulisseau normale", helpText: "Vitesse régulière" },
        { numero: 61, label: "Remontée coulisseau normale", helpText: null },
        { numero: 62, label: "Point mort haut atteint", helpText: null },
        { numero: 63, label: "Point mort bas configurable", helpText: null },
        { numero: 64, label: "Arrêt instantané à la commande", helpText: null },
        { numero: 65, label: "Pas de dérive en position maintenue", helpText: null },
        { numero: 66, label: "Fonctionnement en mode coup par coup", helpText: null },
        { numero: 67, label: "Temps de cycle cohérent", helpText: null },
        { numero: 68, label: "Bruit de fonctionnement normal", helpText: "Pas de cognements anormaux" },
        { numero: 69, label: "Température de fonctionnement normale", helpText: "Après quelques cycles" },
      ]
    },
    {
      code: "O",
      title: "Points complémentaires",
      items: [
        { numero: 70, label: "Formation opérateurs attestée", helpText: null },
        { numero: 71, label: "Habilitation maintenance électrique", helpText: null },
        { numero: 72, label: "EPI adaptés disponibles", helpText: "Gants, lunettes..." },
        { numero: 73, label: "Consignes de sécurité affichées", helpText: null },
        { numero: 74, label: "Procédure de consignation définie", helpText: null },
        { numero: 75, label: "Zone de travail dégagée", helpText: null },
        { numero: 76, label: "Extincteur à proximité", helpText: null },
      ]
    }
  ]
};

export async function seedVGPPressesTemplate(): Promise<string> {
  const now = new Date().toISOString();
  
  // Vérifier si le template existe déjà (idempotent)
  const existing = await pgQuery<{ id: string }>(
    "SELECT id FROM vgp_templates WHERE name = $1 AND version = 1",
    [VGP_PRESSES_TEMPLATE.name]
  );
  
  if (existing.length > 0) {
    console.log("[VGP SEED] Template already exists:", existing[0].id);
    return existing[0].id;
  }
  
  const templateId = "vgp_tpl_presses_v1";
  
  // Créer le template
  await pgQuery(
    `INSERT INTO vgp_templates (id, name, machine_type, version, active, referentiel, metadata, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      templateId,
      VGP_PRESSES_TEMPLATE.name,
      VGP_PRESSES_TEMPLATE.machineType,
      1,
      true,
      VGP_PRESSES_TEMPLATE.referentiel,
      JSON.stringify({ source: "seed", type: "presses_plieuses_hydrauliques" }),
      now,
      now
    ]
  );
  
  console.log("[VGP SEED] Template created:", templateId);
  
  // Créer les sections et items
  for (let sIdx = 0; sIdx < VGP_PRESSES_TEMPLATE.sections.length; sIdx++) {
    const section = VGP_PRESSES_TEMPLATE.sections[sIdx];
    const sectionId = `vgp_sec_${section.code.toLowerCase()}_v1`;
    
    await pgQuery(
      `INSERT INTO vgp_template_sections (id, template_id, code, title, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [sectionId, templateId, section.code, section.title, sIdx]
    );
    
    for (let iIdx = 0; iIdx < section.items.length; iIdx++) {
      const item = section.items[iIdx];
      const itemId = `vgp_item_${item.numero}_v1`;
      
      await pgQuery(
        `INSERT INTO vgp_template_items (id, section_id, numero, label, help_text, sort_order, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [itemId, sectionId, item.numero, item.label, item.helpText, iIdx, true]
      );
    }
  }
  
  console.log("[VGP SEED] Template seeded with", VGP_PRESSES_TEMPLATE.sections.length, "sections");
  
  return templateId;
}

// Seed données démo (optionnel, pour tests)
export async function seedVGPDemoData(): Promise<void> {
  const now = new Date().toISOString();
  
  // Vérifier si les données démo existent déjà
  const existingClient = await pgQuery<{ id: string }>(
    "SELECT id FROM clients WHERE id = $1",
    ["demo_metal_sas"]
  );
  
  if (existingClient.length > 0) {
    console.log("[VGP SEED] Demo data already exists");
    return;
  }
  
  // Client DEMO METAL SAS
  await pgQuery(
    `INSERT INTO clients (id, name, created_at) VALUES ($1, $2, $3)`,
    ["demo_metal_sas", "DEMO METAL SAS", now]
  );
  
  // Site
  await pgQuery(
    `INSERT INTO sites (id, client_id, name, address, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    ["demo_site_1", "demo_metal_sas", "Usine Principale", "Zone Industrielle - 69000 Lyon", now]
  );
  
  // Zone
  await pgQuery(
    `INSERT INTO zones (id, site_id, name) VALUES ($1, $2, $3)`,
    ["demo_zone_1", "demo_site_1", "Atelier Pliage"]
  );
  
  // Machine 1 - Conforme (0 observations)
  await pgQuery(
    `INSERT INTO assets (id, code_interne, designation, categorie, marque, modele, numero_serie, annee, statut, criticite, site_id, zone_id, mise_en_service, created_at, force_nominale, compteur_type, compteur_valeur)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      "demo_press_1",
      "PL-001",
      "Presse plieuse CNC AMADA HFE 100-3",
      "PRESSE_PLIEUSE",
      "AMADA",
      "HFE 100-3",
      "HFE100-2019-4521",
      2019,
      "EN_SERVICE",
      3,
      "demo_site_1",
      "demo_zone_1",
      "2019-06-15",
      now,
      "100 tonnes",
      "heures",
      4520
    ]
  );
  
  // Machine 2 - Non conforme (2 observations)
  await pgQuery(
    `INSERT INTO assets (id, code_interne, designation, categorie, marque, modele, numero_serie, annee, statut, criticite, site_id, zone_id, mise_en_service, created_at, force_nominale, compteur_type, compteur_valeur)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      "demo_press_2",
      "PL-002",
      "Presse plieuse TRUMPF TruBend 3100",
      "PRESSE_PLIEUSE",
      "TRUMPF",
      "TruBend 3100",
      "TB3100-2015-8842",
      2015,
      "EN_SERVICE",
      4,
      "demo_site_1",
      "demo_zone_1",
      "2015-03-20",
      now,
      "130 tonnes",
      "coups",
      152340
    ]
  );
  
  console.log("[VGP SEED] Demo data created: 1 client, 1 site, 2 machines");
}
