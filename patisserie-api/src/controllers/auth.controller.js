import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

export const REFRESH_COOKIE = 'refreshToken';

// httpOnly: JavaScript in the browser cannot read it (protects against XSS).
// sameSite strict: the browser does not send it from other sites (protects against CSRF).
// path: only sent to /api/v1/auth, never to the other routes.
const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: env.NODE_ENV === 'production',
  path: '/api/v1/auth',
};

function sendSession(res, status, session) {
  res.cookie(REFRESH_COOKIE, session.refreshToken, { ...cookieOptions, expires: session.refreshExpiresAt });
  res.status(status).json({ data: { user: session.user, accessToken: session.accessToken } });
}

export const register = asyncHandler(async (req, res) => {
  sendSession(res, 201, await authService.register(req.validated.body));
});

export const login = asyncHandler(async (req, res) => {
  sendSession(res, 200, await authService.login(req.validated.body));
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    sendSession(res, 200, await authService.refresh(req.cookies[REFRESH_COOKIE]));
  } catch (err) {
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    throw err;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.status(204).end();
});
