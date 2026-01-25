# Build Android - In-Spectra

Guide pour construire l'application Android In-Spectra en mode standalone (sans Expo Go).

## Prérequis

- Node.js 18+ ou Bun 1.0+
- Compte Expo (https://expo.dev)
- EAS CLI installé : `npm install -g eas-cli`
- Être connecté : `eas login`

## Configuration

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `app.json` | Configuration Expo (nom, icône, package Android) |
| `eas.json` | Profils de build EAS (development, preview, production) |

### Package Android

```
com.inspectra.app
```

## Profils de build

### 1. Development (dev-client)

Build de développement avec hot-reload et outils de debug.

```bash
bun run build:dev
# ou
eas build --profile development --platform android
```

**Résultat** : APK debug avec expo-dev-client

### 2. Preview (APK standalone)

Build de test interne, APK installable directement.

```bash
bun run build:apk
# ou
eas build --profile preview --platform android
```

**Résultat** : APK release signé (installable sans Play Store)

### 3. Production (AAB)

Build pour publication sur Google Play Store.

```bash
bun run build:aab
# ou
eas build --profile production --platform android
```

**Résultat** : Android App Bundle (.aab) signé

## Commandes rapides

```bash
# Build APK de test
bun run build:apk

# Build AAB pour Play Store
bun run build:aab

# Build dev-client
bun run build:dev

# Soumettre au Play Store
bun run submit:android
```

## Télécharger l'APK

Après le build :

1. Aller sur https://expo.dev
2. Sélectionner le projet "in-spectra-asset-control"
3. Onglet "Builds"
4. Cliquer sur le build terminé
5. Télécharger l'APK/AAB

Ou via CLI :
```bash
eas build:list --platform android
# Copier l'URL du build et télécharger
```

## Installation APK sur appareil

### Via ADB
```bash
adb install -r in-spectra.apk
```

### Via transfert
1. Transférer l'APK sur le téléphone
2. Ouvrir le fichier
3. Autoriser l'installation depuis "Sources inconnues"
4. Installer

## Variables d'environnement

Les variables sont définies par profil dans `eas.json` :

| Profil | APP_ENV |
|--------|---------|
| development | development |
| preview | preview |
| production | production |

Pour ajouter d'autres variables :

```json
// eas.json
{
  "build": {
    "preview": {
      "env": {
        "APP_ENV": "preview",
        "API_URL": "https://api.in-spectra.com"
      }
    }
  }
}
```

## Signature

### Keystore automatique (recommandé)

EAS génère et gère automatiquement le keystore au premier build.

### Keystore personnalisé

```bash
# Générer un keystore
keytool -genkeypair -v -storetype PKCS12 -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

# Configurer dans EAS
eas credentials
```

## Incrémenter la version

Avant chaque release :

1. Modifier `app.json` :
```json
{
  "expo": {
    "version": "1.1.0",
    "android": {
      "versionCode": 2
    }
  }
}
```

2. Reconstruire :
```bash
bun run build:aab
```

## Dépannage

### Erreur "Package name already exists"
Le package `com.inspectra.app` doit être unique sur le Play Store.

### Build échoué
```bash
# Voir les logs détaillés
eas build --profile preview --platform android --clear-cache
```

### Problème de credentials
```bash
# Réinitialiser les credentials
eas credentials --platform android
```

## Architecture des builds

```
┌─────────────────────────────────────────────────────────────┐
│                        eas.json                             │
├─────────────────┬─────────────────┬─────────────────────────┤
│   development   │     preview     │       production        │
├─────────────────┼─────────────────┼─────────────────────────┤
│ devClient: true │ buildType: apk  │ buildType: app-bundle   │
│ distribution:   │ distribution:   │ distribution: store     │
│   internal      │   internal      │                         │
├─────────────────┼─────────────────┼─────────────────────────┤
│     APK debug   │  APK release    │     AAB release         │
│   + dev tools   │   standalone    │   (Play Store)          │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Liens utiles

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android App Signing](https://docs.expo.dev/app-signing/app-credentials/)
- [Play Store Submission](https://docs.expo.dev/submit/android/)
- [Expo Dashboard](https://expo.dev)

---

**Dernière mise à jour** : Janvier 2025
