import { useState, useEffect, useCallback, useRef } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User, UserRole } from '@/types';
import { userRepository } from '@/repositories/UserRepository';
import { useDatabase } from '@/contexts/DatabaseContext';

const STORAGE_KEY = 'inspectra_auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface StoredAuth {
  userId: string;
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
    
    if (stored?.userId) {
      const user = await userRepository.getById(stored.userId);
      if (user) {
        console.log('[AUTH] Restored session for:', user.email);
        setState({ user, isLoading: false, isAuthenticated: true });
        return;
      }
    }
    
    setState({ user: null, isLoading: false, isAuthenticated: false });
  };

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    console.log('[AUTH] Attempting login for:', email);
    
    try {
      const user = await userRepository.getByEmail(email.toLowerCase().trim());
      
      if (!user) {
        console.log('[AUTH] User not found for email:', email);
        return false;
      }
      
      await setStoredAuth({ userId: user.id });
      setState({ user, isLoading: false, isAuthenticated: true });
      console.log('[AUTH] Login successful for:', user.email, 'role:', user.role);
      return true;
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      return false;
    }
  }, []);

  const loginAsRole = useCallback(async (role: UserRole): Promise<boolean> => {
    console.log('[AUTH] Quick login as role:', role);
    
    const users = await userRepository.getByRole(role);
    
    if (users.length === 0) {
      const allUsers = await userRepository.getAll();
      if (allUsers.length > 0) {
        const user = allUsers[0];
        await setStoredAuth({ userId: user.id });
        setState({ user, isLoading: false, isAuthenticated: true });
        return true;
      }
      return false;
    }
    
    const user = users[0];
    await setStoredAuth({ userId: user.id });
    setState({ user, isLoading: false, isAuthenticated: true });
    return true;
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
    loginAsRole,
    logout,
    hasPermission,
    canCreate,
    canValidate,
    canEdit,
    isReadOnly,
  };
});
