# Deploying Your Expo App

This guide provides instructions for deploying your Expo application to the Apple App Store and Google Play Store.

## Prerequisites

- [Node.js and Bun](https://bun.sh/docs/installation) installed.
- An Expo account. If you don't have one, create one at [expo.dev](https://expo.dev/).
- EAS CLI installed globally: `bun i -g @expo/eas-cli`.

## Configuration

Before you can build your app, you need to configure your project for EAS Build.

1.  **Log in to your Expo account:**

    ```bash
    eas login
    ```

2.  **Configure your project:**

    ```bash
    eas build:configure
    ```

    This command will create an `eas.json` file in your project root, which contains the build profiles for your app.

## Building the App

You can build your app for iOS, Android, or both.

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

This will start a build on Expo's servers. You can monitor the build progress from your terminal or from the Expo dashboard.

## Submitting to App Stores

Once the build is complete, you can submit your app to the respective app stores.

### Apple App Store

```bash
eas submit --platform ios
```

### Google Play Store

```bash
eas submit --platform android
```

For more detailed information, please refer to the official Expo documentation:

-   [Deploying to App Stores](https://docs.expo.dev/deploy/build-project/)
-   [Submitting to the Apple App Store](https://docs.expo.dev/submit/ios/)
-   [Submitting to the Google Play Store](https://docs.expo.dev/submit/android/)
