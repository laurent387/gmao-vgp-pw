import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const AUTH_STORAGE_KEY = "inspectra_auth";

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!url) {
    return "https://api.in-spectra.com";
  }
  return url;
};

async function getAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.token || null;
    }

    // Native
    const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch (e) {
    console.warn("[API] Unable to load auth token", e);
    return null;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getBaseUrl();
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const url = `${baseUrl}${path}`;
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}
