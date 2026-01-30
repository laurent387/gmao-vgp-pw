import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DatabaseProvider, useDatabase } from "@/contexts/DatabaseContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { colors } from "@/constants/theme";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Initialisation...</Text>
    </View>
  );
}

function RootLayoutNav() {
  const { isReady, error } = useDatabase();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isReady && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isReady, isLoading]);

  if (!isReady || isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Retour",
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="asset/[id]"
        options={{ title: "Détail équipement" }}
      />
      <Stack.Screen
        name="mission/[id]"
        options={{ title: "Détail mission" }}
      />
      <Stack.Screen
        name="mission/create"
        options={{ title: "Nouvelle mission", presentation: "modal" }}
      />
      <Stack.Screen
        name="mission/execute"
        options={{ title: "Exécuter contrôle" }}
      />
      <Stack.Screen
        name="nc/[id]"
        options={{ title: "Non-conformité" }}
      />
      <Stack.Screen
        name="nc/create"
        options={{ title: "Nouvelle NC", presentation: "modal" }}
      />
      <Stack.Screen
        name="maintenance/add"
        options={{ title: "Ajouter maintenance", presentation: "modal" }}
      />
      <Stack.Screen
        name="profile"
        options={{ title: "Mon profil" }}
      />
      <Stack.Screen
        name="reset-password"
        options={{ title: "Nouveau mot de passe", headerShown: false }}
      />
      <Stack.Screen
        name="client/[id]"
        options={{ title: "Profil Client" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <DatabaseProvider>
            <AuthProvider>
              <NotificationProvider>
                <RootLayoutNav />
              </NotificationProvider>
            </AuthProvider>
          </DatabaseProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    textAlign: "center",
    padding: 20,
  },
});
