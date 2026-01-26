import React, { useState, useEffect, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { initializeDatabase, clearDatabase } from '@/db/database';
import { Platform } from 'react-native';

interface DatabaseState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}

export const [DatabaseProvider, useDatabase] = createContextHook(() => {
  const [state, setState] = useState<DatabaseState>({
    isReady: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    initDb();
  }, []);

  const initDb = async () => {
    try {
      console.log('[DATABASE] Initializing...');
      
      if (Platform.OS === 'web') {
        console.log('[DATABASE] Web platform - skipping local database');
        setState({ isReady: true, isLoading: false, error: null });
        return;
      }

      await initializeDatabase();
      
      console.log('[DATABASE] Ready');
      setState({ isReady: true, isLoading: false, error: null });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      console.error('[DATABASE] Initialization failed:', error);
      setState({ isReady: false, isLoading: false, error });
    }
  };

  const resetDatabase = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      await clearDatabase();
      setState({ isReady: true, isLoading: false, error: null });
      console.log('[DATABASE] Reset complete');
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      setState({ isReady: false, isLoading: false, error });
    }
  }, []);

  return {
    ...state,
    resetDatabase,
  };
});
