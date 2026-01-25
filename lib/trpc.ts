import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Production API URL
  const productionUrl = "https://api.in-spectra.com";
  
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  // Use production URL, ignore dev URLs
  if (envUrl && !envUrl.includes('rorktest.dev') && !envUrl.includes('localhost')) {
    console.log("[TRPC] Using env API base URL:", envUrl);
    return envUrl;
  }

  console.log("[TRPC] Using production API base URL:", productionUrl);
  return productionUrl;
};

const baseUrl = getBaseUrl();

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${baseUrl}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log("[TRPC] Fetching:", url);
        try {
          const response = await fetch(url, {
            ...options,
            credentials: 'include',
          });
          if (!response.ok) {
            console.error("[TRPC] HTTP error:", response.status, response.statusText);
          }
          return response;
        } catch (error) {
          console.error("[TRPC] Network error:", error);
          console.error("[TRPC] Attempted URL:", url);
          console.error("[TRPC] Base URL configured:", baseUrl);
          throw error;
        }
      },
    }),
  ],
});
