import crypto from 'crypto';

const IS_PROD = process.env.NODE_ENV === 'production';
const EPHEMERAL_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

export const JWT_SECRET =
  process.env.JWT_SECRET ||
  (IS_PROD ? EPHEMERAL_FALLBACK_SECRET : 'volley-dev-only-secret-key-2026');
