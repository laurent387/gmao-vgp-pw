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
    
    const db = await getDatabase();
    return db.getFirstAsync<User>('SELECT * FROM users WHERE email = ?', [email]);
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
