import crypto from 'crypto';

/**
 * Hashes a plain-text password using pbkdf2 with a random salt.
 * @param {string} password 
 * @returns {string} The salt and hash joined by a colon
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain-text password against a stored hashed password.
 * @param {string} password 
 * @param {string} storedPassword 
 * @returns {boolean} True if they match
 */
export function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(':')) {
    return false;
  }
  const [salt, originalHash] = storedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}
