import { getDatabase } from '@/db/database';
import { User, UserRole } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';
import { webApiService } from '@/services/WebApiService';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async getByEmail(email: string): Promise<User | null> {
    if (Platform.OS === 'web') {
      try {
        const { data } = await import('@/app/api').then(m => m.getUsers());
        const users = Array.isArray(data) ? data : [];
        const normalizedEmail = email.toLowerCase().trim();
        const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
        return user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          token_mock: null,
          created_at: new Date().toISOString(),
        } : null;
      } catch (error) {
        console.error('[USER_REPO] Error fetching user from API:', error);
        return null;
      }
    }
    
    try {
      const db = await getDatabase();
      const normalizedEmail = email.toLowerCase().trim();
      console.log('[USER_REPO] Looking for user with email:', normalizedEmail);
      const user = await db.getFirstAsync<User>('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
      console.log('[USER_REPO] Found user:', user ? user.email : 'null');
      return user;
    } catch (error) {
      console.error('[USER_REPO] Error getting user by email:', error);
      return null;
    }
  }

  async getByRole(role: UserRole): Promise<User[]> {
    if (Platform.OS === 'web') {
      try {
        const { data } = await import('@/app/api').then(m => m.getUsers());
        const users = Array.isArray(data) ? data : [];
        return users
          .filter(u => u.role === role)
          .map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role as UserRole,
            token_mock: null,
            created_at: new Date().toISOString(),
          }));
      } catch (error) {
        console.error('[USER_REPO] Error fetching users from API:', error);
        return [];
      }
    }
    
    const db = await getDatabase();
    return db.getAllAsync<User>('SELECT * FROM users WHERE role = ?', [role]);
  }

  async getTechnicians(): Promise<User[]> {
    console.log('[USER_REPO] Fetching technicians');
    if (Platform.OS === 'web') {
      try {
        const users = await webApiService.getTechnicians();
        console.log('[USER_REPO] Got technicians from API:', Array.isArray(users) ? users.length : 'undefined');
        return users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role as UserRole,
          token_mock: null,
          created_at: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('[USER_REPO] Error fetching technicians from API:', error);
        return [];
      }
    }
    
    try {
      const db = await getDatabase();
      return db.getAllAsync<User>("SELECT * FROM users WHERE role IN ('TECHNICIAN', 'HSE_MANAGER', 'ADMIN')");
    } catch (error) {
      console.error('[USER_REPO] Error fetching technicians from database:', error);
      return [];
    }
  }

  async getAll(): Promise<User[]> {
    console.log('[USER_REPO] Fetching all users');
    if (Platform.OS === 'web') {
      try {
        const { data } = await import('@/app/api').then(m => m.getUsers());
        const users = Array.isArray(data) ? data : [];
        console.log('[USER_REPO] Got users from API:', users.length);
        return users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role as UserRole,
          token_mock: null,
          created_at: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('[USER_REPO] Error fetching users from API:', error);
        return [];
      }
    }
    
    try {
      const db = await getDatabase();
      return db.getAllAsync<User>('SELECT * FROM users');
    } catch (error) {
      console.error('[USER_REPO] Error fetching users from database:', error);
      return [];
    }
  }
}

export const userRepository = new UserRepository();
