import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

export const trpc = createTRPCReact<any>();

const normalizeBaseUrl = (raw: string) => {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed;
};

const getBaseUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  const fallback = "https://api.in-spectra.com";

  const picked = normalizeBaseUrl(fromEnv && fromEnv.length > 0 ? fromEnv : fallback);

  console.log("[TRPC] Base URL configured:", picked);
  console.log("[TRPC] Env EXPO_PUBLIC_RORK_API_BASE_URL:", fromEnv ?? "<undefined>");

  return picked;
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
            credentials: "include",
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
