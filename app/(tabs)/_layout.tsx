import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { LayoutDashboard, Package, Calendar, ClipboardList, AlertTriangle, RefreshCw, Shield, CheckSquare, Building2 } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, canValidate } = useAuth();

  const isManager = canValidate();
  const isTechnician = user?.role === 'TECHNICIAN';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tableau de bord',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
          href: isTechnician ? '/(tabs)' : null,
        }}
      />
      <Tabs.Screen
        name="manager"
        options={{
          title: 'Manager',
          tabBarIcon: ({ color, size }) => <Shield size={size} color={color} />,
          href: isManager ? '/(tabs)/manager' : null,
        }}
      />
      <Tabs.Screen
        name="validation"
        options={{
          title: 'Validation',
          tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} />,
          href: isManager ? '/(tabs)/validation' : null,
        }}
      />
      <Tabs.Screen
        name="sites"
        options={{
          title: 'Sites clients',
          tabBarIcon: ({ color, size }) => <Building2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Équipements',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: 'Planning',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: 'Missions',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nc"
        options={{
          title: 'NC & Actions',
          tabBarIcon: ({ color, size }) => <AlertTriangle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: 'Sync',
          tabBarIcon: ({ color, size }) => <RefreshCw size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
