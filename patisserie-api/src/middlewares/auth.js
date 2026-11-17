import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokens.js';

// Route-level middleware: placed in front of every protected route.
// Reads "Authorization: Bearer <token>", checks the signature and expiry, then loads
// the user so a disabled account or a changed role takes effect immediately.
export async function authenticate(req, _res, next) {
  try {
    const [scheme, token] = (req.get('authorization') || '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new AppError(401, 'AUTH_REQUIRED', 'Log in to access this resource');

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) throw new AppError(401, 'TOKEN_EXPIRED', 'Access token expired, refresh it');
      throw new AppError(401, 'INVALID_TOKEN', 'Access token is invalid');
    }

    const user = await User.findById(payload.sub).select('email role isActive').lean();
    if (!user || !user.isActive) throw new AppError(401, 'INVALID_TOKEN', 'Access token is invalid');

    req.user = { id: user._id, email: user.email, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

// Always placed after authenticate: authenticate answers "who are you?" (401),
// authorize answers "are you allowed?" (403).
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to do this'));
    }
    next();
  };
