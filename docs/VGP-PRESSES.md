# Module VGP Presses - Documentation

## Présentation

Le module **VGP Presses** permet de réaliser les Vérifications Générales Périodiques (VGP) des presses conformément au Code du travail (Art. R.4323-23 à R.4323-27).

## Fonctionnalités

### 1. Templates VGP (Fiches types)
- Template par défaut "VGP Presses Plieuses Hydrauliques" avec 15 sections et 76 points de contrôle
- Sections A → O couvrant tous les aspects de la vérification
- Templates versionnés et duplicables
- Administration via l'écran "VGP Presses"

### 2. Création d'une VGP
1. Accéder à l'onglet **VGP Presses**
2. Cliquer sur **"Démarrer une VGP"**
3. Suivre l'assistant :
   - Sélectionner le client
   - Sélectionner le site
   - Sélectionner les machines à vérifier (multi-sélection)
   - Choisir le template (VGP Presses par défaut)
   - Confirmer et saisir le nom du vérificateur

### 3. Saisie de la fiche de contrôle
Pour chaque machine :
1. Renseigner l'en-tête :
   - Type et valeur compteur (heures/coups)
   - Conditions d'intervention
   - Particularités / dispositifs de protection
   - Moyens mis à disposition

2. Remplir la checklist :
   - Parcourir les sections (A → O)
   - Pour chaque point : **OUI** / **NON** / **N/A**
   - Ajouter des commentaires si nécessaire

3. **Auto-observation** : Chaque réponse "NON" génère automatiquement une observation
   - Description : "Non conformité au point X : [libellé]"
   - Si le point repasse à OUI/NA, l'observation est marquée "Résolue"

4. Valider la fiche avec la conclusion :
   - ✅ Conforme
   - ⚠️ Conforme sous réserve
   - ❌ Non conforme

### 4. Gestion des observations
- Vue récapitulative filtrable par statut (Ouvertes / Résolues / Traitées)
- Gravité sur 5 niveaux
- Export CSV disponible
- Actions : Marquer comme résolue / traitée

### 5. Génération du rapport PDF
Le rapport PDF suit la structure "organisme de contrôle" :
- **Page de garde** : N° rapport, client, site, date, signataire, synthèse
- **Préambule** : Objet, limites, conservation, confidentialité
- **Sommaire** avec récapitulatif des observations
- **Détail par machine** :
  - Identification (nature, marque, modèle, n° série, force, compteur)
  - Mission / référentiel
  - Moyens mis à disposition
  - Résultats
  - Observations détaillées avec recommandations

## Structure technique

### Tables PostgreSQL
```sql
vgp_templates           -- Templates de checklist
vgp_template_sections   -- Sections (A, B, C...)
vgp_template_items      -- Points de contrôle (1-76)
vgp_reports             -- Rapports (regroupement multi-machines)
vgp_inspection_runs     -- Fiches par machine
vgp_item_results        -- Résultats OUI/NON/NA
vgp_observations        -- Non-conformités
```

### Fichiers principaux
```
backend/
  db/vgp-schema.ts      -- Schéma DB VGP
  db/vgp-seed.ts        -- Seed template 76 points
  trpc/routes/vgp.ts    -- Router tRPC (CRUD, PDF)

app/
  (tabs)/vgp.tsx        -- Liste templates, accès VGP
  vgp/
    start.tsx           -- Assistant création VGP
    run/[runId].tsx     -- Saisie checklist
    observations.tsx    -- Récap observations
    report/[reportId].tsx -- Vue rapport

types/index.ts          -- Types VGP* (VGPTemplate, VGPRun, etc.)
```

### Endpoints tRPC
| Endpoint | Description |
|----------|-------------|
| `vgp.listTemplates` | Liste des templates |
| `vgp.getTemplateById` | Détail template + sections + items |
| `vgp.duplicateTemplate` | Dupliquer un template |
| `vgp.createReport` | Créer rapport + fiches |
| `vgp.getRunById` | Fiche avec checklist |
| `vgp.updateItemResult` | Saisir OUI/NON/NA |
| `vgp.listObservations` | Liste observations |
| `vgp.validateRun` | Valider une fiche |
| `vgp.finalizeReport` | Finaliser rapport |
| `vgp.generatePDF` | Générer le PDF |

## Template VGP Presses Plieuses Hydrauliques

### Sections
| Code | Titre | Points |
|------|-------|--------|
| A | Bâti et structure | 1-5 |
| B | Circuit hydraulique | 6-10 |
| C | Commandes et organes de service | 11-15 |
| D | Arrêts d'urgence | 16-20 |
| E | Protections mécaniques fixes | 21-24 |
| F | Protections mobiles avec inter-verrouillage | 25-28 |
| G | Dispositifs optoélectroniques | 29-33 |
| H | Systèmes de retenue mécanique | 34-36 |
| I | Éclairage et signalisation | 37-40 |
| J | Installation électrique | 41-45 |
| K | Ergonomie et accessibilité | 46-50 |
| L | Documentation et marquage | 51-55 |
| M | Maintenance et historique | 56-59 |
| N | Essais à vide | 60-69 |
| O | Points complémentaires | 70-76 |

## Données de démo

En environnement de développement, les données suivantes sont créées :
- Client : DEMO METAL SAS
- Site : Usine Principale (Lyon)
- Machines :
  - PL-001 : Presse AMADA HFE 100-3 (conforme)
  - PL-002 : Presse TRUMPF TruBend 3100 (avec observations)

## Migration

La migration est automatique au démarrage du serveur :
1. `ensureVGPSchema()` crée les tables VGP
2. `seedVGPPressesTemplate()` insère le template (idempotent)
3. `seedVGPDemoData()` ajoute les données démo (dev only)

## Notes importantes

- Les vérifications portent sur les parties **visibles et accessibles**
- Les essais sont réalisés **à vide** (conditions sûres)
- Le rapport doit être conservé **5 ans minimum**
- Référentiel : Code du travail Art. R.4323-23 à R.4323-27
