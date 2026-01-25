import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Production API - hardcoded to avoid env issues
  const baseUrl = "https://api.in-spectra.com";
  console.log("[TRPC] Using API:", baseUrl);
  return baseUrl;
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
          console.error("[TRPC] API URL:", baseUrl);
          throw error;
        }
      },
    }),
  ],
});
