import { getDatabase } from '@/db/database';
import { User, UserRole } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async getByEmail(email: string): Promise<User | null> {
    if (Platform.OS === 'web') return null;
    
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
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    return db.getAllAsync<User>('SELECT * FROM users WHERE role = ?', [role]);
  }

  async getTechnicians(): Promise<User[]> {
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    return db.getAllAsync<User>("SELECT * FROM users WHERE role IN ('TECHNICIAN', 'HSE_MANAGER', 'ADMIN')");
  }
}

export const userRepository = new UserRepository();
