import bcrypt from "bcryptjs";
import crypto from "crypto";

const DEFAULT_SALT_ROUNDS = 10;

export function generateTempPassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += alphabet[bytes[i] % alphabet.length];
  }
  return password;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, DEFAULT_SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
