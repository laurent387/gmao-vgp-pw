import { getDatabase } from '@/db/database';
import { User, UserRole } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';
import { trpcClient } from '@/lib/trpc';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  private normalize(list: any): any[] {
    if (Array.isArray(list)) return list;
    if (list && Array.isArray((list as any).json)) return (list as any).json as any[];
    return [];
  }

  async getByEmail(email: string): Promise<User | null> {
    if (Platform.OS === 'web') {
      try {
        const raw = await trpcClient.auth.listUsers.query();
        const users = this.normalize(raw);
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
        console.error('[USER_REPO] Error fetching user from backend:', error);
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
        const raw = await trpcClient.auth.listUsers.query();
        const users = this.normalize(raw);
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
        console.error('[USER_REPO] Error fetching users from backend:', error);
        return [];
      }
    }
    
    const db = await getDatabase();
    return db.getAllAsync<User>('SELECT * FROM users WHERE role = ?', [role]);
  }

  async getTechnicians(): Promise<User[]> {
    console.log('[USER_REPO] Fetching technicians from backend');
    try {
      const raw = await trpcClient.auth.listTechnicians.query();
      const users = this.normalize(raw);
      console.log('[USER_REPO] Got technicians from backend:', Array.isArray(users) ? users.length : 'undefined');
      return users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role as UserRole,
        token_mock: null,
        created_at: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('[USER_REPO] Error fetching technicians from backend:', error);
      
      if (Platform.OS !== 'web') {
        const db = await getDatabase();
        return db.getAllAsync<User>("SELECT * FROM users WHERE role IN ('TECHNICIAN', 'HSE_MANAGER', 'ADMIN')");
      }
      
      return [];
    }
  }

  async getAll(): Promise<User[]> {
    console.log('[USER_REPO] Fetching all users from backend');
    try {
      const raw = await trpcClient.auth.listUsers.query();
      const users = this.normalize(raw);
      console.log('[USER_REPO] Got users from backend:', Array.isArray(users) ? users.length : 'undefined');
      return users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role as UserRole,
        token_mock: null,
        created_at: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('[USER_REPO] Error fetching users from backend:', error);
      
      if (Platform.OS !== 'web') {
        const db = await getDatabase();
        return db.getAllAsync<User>('SELECT * FROM users');
      }
      
      return [];
    }
  }
}

export const userRepository = new UserRepository();
