import { useState, useCallback, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const NOTIFICATIONS_KEY = 'inspectra_notifications';

export interface AppNotification {
  id: string;
  type: 'maintenance_assigned' | 'mission_assigned' | 'nc_created' | 'general';
  title: string;
  message: string;
  data?: {
    maintenanceId?: string;
    missionId?: string;
    assetId?: string;
    date?: string;
    calendarInviteUrl?: string;
  };
  read: boolean;
  createdAt: string;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
    registerForPushNotifications();
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (e) {
      console.error('[NOTIFICATIONS] Error loading notifications:', e);
    }
  };

  const saveNotifications = async (notifs: AppNotification[]) => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
    } catch (e) {
      console.error('[NOTIFICATIONS] Error saving notifications:', e);
    }
  };

  const registerForPushNotifications = async () => {
    if (Platform.OS === 'web') {
      console.log('[NOTIFICATIONS] Push notifications not supported on web');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NOTIFICATIONS] Permission not granted');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      setExpoPushToken(tokenData.data);
      console.log('[NOTIFICATIONS] Push token:', tokenData.data);
    } catch (e) {
      console.error('[NOTIFICATIONS] Error registering for push:', e);
    }
  };

  const addNotification = useCallback(async (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    await saveNotifications(updated);

    if (Platform.OS !== 'web') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: notification.data,
        },
        trigger: null,
      });
    }

    return newNotification;
  }, [notifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    await saveNotifications(updated);
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    await saveNotifications(updated);
  }, [notifications]);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
  }, []);

  const sendMaintenanceNotification = useCallback(async (params: {
    technicianName: string;
    assetDesignation: string;
    date: string;
    maintenanceId: string;
    assetId: string;
    operationType: string;
    calendarInviteUrl?: string;
  }) => {
    const operationLabels: Record<string, string> = {
      'MAINTENANCE': 'Maintenance',
      'INSPECTION': 'Inspection',
      'REPARATION': 'Réparation',
      'MODIFICATION': 'Modification',
    };

    return addNotification({
      type: 'maintenance_assigned',
      title: '🔧 Nouvelle intervention assignée',
      message: `${operationLabels[params.operationType] || params.operationType} sur ${params.assetDesignation} planifiée le ${new Date(params.date).toLocaleDateString('fr-FR')}`,
      data: {
        maintenanceId: params.maintenanceId,
        assetId: params.assetId,
        date: params.date,
        calendarInviteUrl: params.calendarInviteUrl,
      },
    });
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    expoPushToken,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    sendMaintenanceNotification,
  };
});
