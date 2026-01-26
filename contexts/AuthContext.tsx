import { useState, useEffect, useCallback, useRef } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User, UserRole } from '@/types';
import { useDatabase } from '@/contexts/DatabaseContext';
import { trpcClient } from '@/lib/trpc';

const STORAGE_KEY = 'inspectra_auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface StoredAuth {
  user: User;
  token?: string;
}

async function getStoredAuth(): Promise<StoredAuth | null> {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    }
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('[AUTH] Error reading stored auth:', e);
    return null;
  }
}

async function setStoredAuth(auth: StoredAuth | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (auth) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }
    if (auth) {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(auth));
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
  } catch (e) {
    console.error('[AUTH] Error storing auth:', e);
  }
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const { isReady: dbReady } = useDatabase();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (dbReady && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadStoredAuth();
    }
  }, [dbReady]);

  const loadStoredAuth = async () => {
    console.log('[AUTH] Loading stored auth...');
    const stored = await getStoredAuth();
    
    if (stored?.user?.id) {
      console.log('[AUTH] Restored session for:', stored.user.email);
      setState({ user: stored.user, isLoading: false, isAuthenticated: true });
      return;
    }
    
    setState({ user: null, isLoading: false, isAuthenticated: false });
  };

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    console.log('[AUTH] Attempting login for:', email);
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      console.log('[AUTH] Calling backend API...');

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      const result = await Promise.race([
        trpcClient.auth.login.mutate({
          email: normalizedEmail,
          password: password || 'demo123',
        }),
        timeoutPromise,
      ]);

      if (!result?.user) {
        console.log('[AUTH] Backend returned no user');
        return false;
      }
      
      const user: User = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role as UserRole,
        token_mock: result.token,
        created_at: new Date().toISOString(),
      };
      
      await setStoredAuth({ user, token: result.token });
      setState({ user, isLoading: false, isAuthenticated: true });
      console.log('[AUTH] Login successful for:', user.email, 'role:', user.role);
      return true;
    } catch (error: any) {
      console.log('[AUTH] Backend login failed:', error?.message || 'Unknown error');
      return false;
    }
  }, []);


  const logout = useCallback(async () => {
    console.log('[AUTH] Logging out');
    await setStoredAuth(null);
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const hasPermission = useCallback((requiredRoles: UserRole[]): boolean => {
    if (!state.user) return false;
    return requiredRoles.includes(state.user.role);
  }, [state.user]);

  const canCreate = useCallback((): boolean => {
    return hasPermission(['ADMIN', 'HSE_MANAGER', 'TECHNICIAN']);
  }, [hasPermission]);

  const canValidate = useCallback((): boolean => {
    return hasPermission(['ADMIN', 'HSE_MANAGER']);
  }, [hasPermission]);

  const canEdit = useCallback((): boolean => {
    return hasPermission(['ADMIN', 'HSE_MANAGER', 'TECHNICIAN']);
  }, [hasPermission]);

  const isReadOnly = useCallback((): boolean => {
    return state.user?.role === 'AUDITOR';
  }, [state.user]);

  return {
    ...state,
    login,
    logout,
    hasPermission,
    canCreate,
    canValidate,
    canEdit,
    isReadOnly,
  };
});
