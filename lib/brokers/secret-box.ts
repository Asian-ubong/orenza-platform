import crypto from 'node:crypto';

function key() {
  const raw = process.env.DERIV_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error('DERIV_TOKEN_ENCRYPTION_KEY_MISSING');
  const decoded = Buffer.from(raw, 'base64');
  if (decoded.length !== 32) throw new Error('DERIV_TOKEN_ENCRYPTION_KEY_MUST_BE_32_BYTES_BASE64');
  return decoded;
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptSecret(value: string) {
  const [iv, tag, ciphertext] = value.split('.');
  if (!iv || !tag || !ciphertext) throw new Error('INVALID_ENCRYPTED_SECRET');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
}
