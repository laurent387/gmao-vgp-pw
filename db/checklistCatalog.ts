import { ChecklistItem, ChecklistTemplate, FieldType } from '@/types';

type ChecklistItemSeed = {
  label: string;
  field_type: FieldType;
  required: boolean;
  help_text: string | null;
};

type TemplateSeed = {
  control_type_id: string;
  asset_categories: string[];
  name: string;
  items: ChecklistItemSeed[];
};

type TemplateId = string;

const makeTemplateId = (controlTypeId: string, assetCategory: string): TemplateId =>
  `web-tpl:${controlTypeId}:${assetCategory}`;

const baseCommon: ChecklistItemSeed[] = [
  {
    label: "Présence et lisibilité des marquages (charge, identification, consignes)",
    field_type: 'BOOL',
    required: true,
    help_text: "Vérifier plaques, pictogrammes, avertissements et identification.",
  },
  {
    label: "État général : structure, corrosion, déformations, fixations",
    field_type: 'BOOL',
    required: true,
    help_text: "Inspection visuelle complète.",
  },
  {
    label: "Dispositifs de sécurité : arrêts d'urgence, protections, interverrouillages",
    field_type: 'BOOL',
    required: true,
    help_text: "Vérifier présence, intégrité et fonctionnement.",
  },
  {
    label: "Absence de fuites et niveaux corrects (si applicable)",
    field_type: 'BOOL',
    required: true,
    help_text: "Hydraulique / huile / carburant : pas de fuite active.",
  },
  {
    label: "Essai fonctionnel à vide (mouvements/commandes)",
    field_type: 'BOOL',
    required: true,
    help_text: "Tester commandes principales en conditions sécurisées.",
  },
];

const baseNotes: ChecklistItemSeed[] = [
  {
    label: "Observations / anomalies", 
    field_type: 'TEXT',
    required: false,
    help_text: "Décrire toute observation utile (contexte, photos, etc.).",
  },
];

const webTemplates: TemplateSeed[] = [
  {
    control_type_id: 'ct1',
    asset_categories: ['Chariot élévateur', 'Gerbeur', 'Transpalette', 'Gerbeur manuel'],
    name: 'VGP — Manutention (chariots/gerbeurs/transpalettes)',
    items: [
      ...baseCommon,
      {
        label: "Fourches/bras/accessoires : usure, fissures, verrouillage",
        field_type: 'BOOL',
        required: true,
        help_text: "Vérifier absence de fissures et verrouillage des accessoires.",
      },
      {
        label: "Freinage (service + parking) : efficacité",
        field_type: 'BOOL',
        required: true,
        help_text: "Essai à vitesse lente.",
      },
      {
        label: "Direction / commandes : jeu anormal / réponse",
        field_type: 'BOOL',
        required: true,
        help_text: "Aucun point dur, comportement stable.",
      },
      {
        label: "Avertisseur sonore / gyrophares / éclairage : fonctionnement",
        field_type: 'BOOL',
        required: true,
        help_text: "Sécurité circulation.",
      },
      {
        label: "Pneus/galets : état et fixation",
        field_type: 'BOOL',
        required: true,
        help_text: "Usure, coupures, fixation correcte.",
      },
      {
        label: "Hauteur de levée max testée (m)",
        field_type: 'NUM',
        required: false,
        help_text: "Optionnel : relever la hauteur si nécessaire.",
      },
      {
        label: "Charge de test (kg)",
        field_type: 'NUM',
        required: false,
        help_text: "Optionnel : charge réellement testée.",
      },
      ...baseNotes,
    ],
  },
  {
    control_type_id: 'ct1',
    asset_categories: ['Pont roulant', 'Treuil'],
    name: 'VGP — Levage (pont roulant / treuil)',
    items: [
      ...baseCommon,
      {
        label: "Câbles/chaînes : usure, torons cassés, allongement",
        field_type: 'BOOL',
        required: true,
        help_text: "Vérifier l’état et la conformité des organes de suspension.",
      },
      {
        label: "Crochet / linguet : intégrité et fermeture",
        field_type: 'BOOL',
        required: true,
        help_text: "Le linguet doit se refermer correctement.",
      },
      {
        label: "Limiteurs / fins de course : fonctionnement",
        field_type: 'BOOL',
        required: true,
        help_text: "Tester les fins de course (haut/bas, translation si applicable).",
      },
      {
        label: "Frein de levage : tenue et arrêt",
        field_type: 'BOOL',
        required: true,
        help_text: "L’équipement doit maintenir la charge sans glissement.",
      },
      {
        label: "Commande pendante / radiocommande : état et réponse",
        field_type: 'BOOL',
        required: true,
        help_text: "Aucun bouton bloqué, arrêt d’urgence opérationnel.",
      },
      {
        label: "Charge d’essai (kg)",
        field_type: 'NUM',
        required: false,
        help_text: "Optionnel : charge réellement testée.",
      },
      ...baseNotes,
    ],
  },
  {
    control_type_id: 'ct1',
    asset_categories: ['Grue mobile'],
    name: 'VGP — Grue mobile',
    items: [
      ...baseCommon,
      {
        label: "Stabilisateurs : état, déploiement, appuis",
        field_type: 'BOOL',
        required: true,
        help_text: "Vérifier stabilité, absence de fuite, fonctionnement.",
      },
      {
        label: "Flèche / télescopage : jeu, fissures, fonctionnement",
        field_type: 'BOOL',
        required: true,
        help_text: "Contrôle visuel + essai mouvements.",
      },
      {
        label: "Limiteur de charge / indicateurs : fonctionnement",
        field_type: 'BOOL',
        required: true,
        help_text: "Vérifier cohérence des indications et alarmes.",
      },
      {
        label: "Élingues/accastillage fournis : état",
        field_type: 'BOOL',
        required: false,
        help_text: "Si fournis avec l’équipement : usure et identification.",
      },
      ...baseNotes,
    ],
  },
  {
    control_type_id: 'ct1',
    asset_categories: ['Nacelle', 'Nacelle ciseaux'],
    name: 'VGP — Nacelles (élévatrices / ciseaux)',
    items: [
      ...baseCommon,
      {
        label: "Garde-corps / portillons / plancher : état",
        field_type: 'BOOL',
        required: true,
        help_text: "Aucun jeu excessif, portillon fonctionnel.",
      },
      {
        label: "Dispositif anti-écrasement / anti-coincement (si présent)",
        field_type: 'BOOL',
        required: false,
        help_text: "Vérifier selon modèle.",
      },
      {
        label: "Commandes panier + commandes sol : cohérence et priorité",
        field_type: 'BOOL',
        required: true,
        help_text: "Tester l'arrêt d'urgence sur chaque poste.",
      },
      {
        label: "Inclinaison / stabilisation : capteurs et alarmes",
        field_type: 'BOOL',
        required: true,
        help_text: "Vérifier alarmes de dévers et blocages.",
      },
      {
        label: "Charge nominale (kg) affichée et respectée",
        field_type: 'BOOL',
        required: true,
        help_text: "Vérifier signalétique de charge maxi et occupants.",
      },
      ...baseNotes,
    ],
  },
  {
    control_type_id: 'ct3',
    asset_categories: ['*'],
    name: 'Remise en service — Checklist générale',
    items: [
      {
        label: "Inspection visuelle complète avant remise en service",
        field_type: 'BOOL',
        required: true,
        help_text: "Corrosion, fissures, pièces manquantes, fixations.",
      },
      {
        label: "Vérification lubrification / niveaux",
        field_type: 'BOOL',
        required: true,
        help_text: "Graissages et fluides si applicable.",
      },
      {
        label: "Test électrique (câbles, connecteurs, arrêt d'urgence)",
        field_type: 'BOOL',
        required: true,
        help_text: "Aucune détérioration visible, arrêt d'urgence OK.",
      },
      {
        label: "Essais fonctionnels progressifs (à vide puis charge si pertinent)",
        field_type: 'BOOL',
        required: true,
        help_text: "Effectuer des essais en zone sécurisée.",
      },
      {
        label: "Durée d’arrêt (jours)",
        field_type: 'NUM',
        required: false,
        help_text: "Optionnel.",
      },
      ...baseNotes,
    ],
  },
];

function getBestCategoryMatch(assetCategory?: string): string | undefined {
  if (!assetCategory) return undefined;
  const normalized = assetCategory.trim();
  if (!normalized) return undefined;
  return normalized;
}

export function getChecklistTemplateForWeb(
  controlTypeId: string,
  assetCategory?: string,
): ChecklistTemplate | null {
  const category = getBestCategoryMatch(assetCategory);
  const candidates = webTemplates.filter(t => t.control_type_id === controlTypeId);

  if (candidates.length === 0) return null;

  const exact = category
    ? candidates.find(t => t.asset_categories.includes(category))
    : undefined;

  if (exact) {
    return {
      id: makeTemplateId(controlTypeId, category!),
      control_type_id: controlTypeId,
      asset_category: category!,
      name: exact.name,
    };
  }

  const wildcard = candidates.find(t => t.asset_categories.includes('*'));
  if (wildcard) {
    return {
      id: makeTemplateId(controlTypeId, '*'),
      control_type_id: controlTypeId,
      asset_category: null,
      name: wildcard.name,
    };
  }

  const first = candidates[0];
  const firstCat = first.asset_categories[0] ?? '*';
  return {
    id: makeTemplateId(controlTypeId, firstCat),
    control_type_id: controlTypeId,
    asset_category: firstCat === '*' ? null : firstCat,
    name: first.name,
  };
}

export function getChecklistItemsForWebTemplateId(templateId: string): ChecklistItem[] {
  const parts = templateId.split(':');
  if (parts.length < 3) return [];

  const controlTypeId = parts[1];
  const category = parts.slice(2).join(':');

  const template = webTemplates.find(
    t => t.control_type_id === controlTypeId && t.asset_categories.includes(category),
  );

  const fallback = !template
    ? webTemplates.find(t => t.control_type_id === controlTypeId && t.asset_categories.includes('*'))
    : null;

  const chosen = template ?? fallback;
  if (!chosen) return [];

  return chosen.items.map((seed, idx) => ({
    id: `web-item:${templateId}:${idx + 1}`,
    template_id: templateId,
    label: seed.label,
    field_type: seed.field_type,
    required: seed.required,
    help_text: seed.help_text,
    sort_order: idx + 1,
  }));
}
