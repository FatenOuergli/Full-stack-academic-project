import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ISSUER = 'patisserie-api';

// Access token: a short-lived signed JWT that says who the user is and their role.
export function signAccessToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: String(user._id),
    expiresIn: env.JWT_ACCESS_TTL,
    issuer: ISSUER,
    algorithm: 'HS256',
  });
}

// Throws jwt.TokenExpiredError or jwt.JsonWebTokenError when the token is not valid.
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: ISSUER, algorithms: ['HS256'] });
}

// Refresh token: a random value with no meaning; only its hash is stored in the database.
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createRefreshToken() {
  const token = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { token, hash: hashToken(token), expiresAt };
}
