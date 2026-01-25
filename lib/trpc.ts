import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { Platform } from "react-native";
import type * as SecureStoreType from "expo-secure-store";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    console.warn("EXPO_PUBLIC_RORK_API_BASE_URL not set, using production fallback");
    return "https://api.in-spectra.com";
  }

  return url;
};

const AUTH_STORAGE_KEY = "inspectra_auth";

let memoryToken: string | null = null;

// On native, eagerly hydrate the in-memory token from SecureStore so tRPC requests
// include Authorization even before AuthContext finishes loading.
if (Platform.OS !== "web") {
  import("expo-secure-store").then((SecureStore: typeof SecureStoreType) => {
    SecureStore.getItemAsync(AUTH_STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.token) {
            memoryToken = parsed.token;
            console.log("[TRPC] Restored token from SecureStore");
          }
        } catch (e) {
          console.warn("[TRPC] Failed to parse stored auth", e);
        }
      })
      .catch((err) => console.warn("[TRPC] Unable to load stored token", err));
  });
}

export function setTrpcAuthToken(token: string | null) {
  memoryToken = token;
}

function getAuthToken(): string | null {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.token || null;
    }

    // Native: rely on in-memory token populated by AuthContext (async storage not sync)
    return memoryToken;
  } catch (e) {
    console.warn("[TRPC] Unable to load auth token", e);
    return null;
  }
}

const baseUrl = getBaseUrl();
console.log(`[TRPC] Using API base URL: ${baseUrl}`);

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpLink({
      url: `${baseUrl}/api/trpc`,
      headers: () => {
        const token = getAuthToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      // Custom fetch to log outgoing requests and network errors
      fetch: async (input, init) => {
        const url = typeof input === "string" ? input : input.toString();
        console.log(`[TRPC] Fetching: ${url}`);
        try {
          return await fetch(input, init);
        } catch (err) {
          console.error(`[TRPC] Network error: ${url}`, err);
          throw err;
        }
      },
    }),
  ],
});
