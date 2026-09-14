import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/** Hash a plaintext password for storage. Never store plaintext passwords. */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/** Compare a plaintext password against a stored bcrypt hash. */
export async function verifyPassword(
  plainText: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
