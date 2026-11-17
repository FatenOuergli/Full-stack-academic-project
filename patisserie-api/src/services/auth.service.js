import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { createRefreshToken, hashToken, signAccessToken } from '../utils/tokens.js';
import { createUser, toPublicUser } from './user.service.js';

const invalidCredentials = () => new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
const invalidRefresh = () => new AppError(401, 'INVALID_REFRESH_TOKEN', 'Session expired, log in again');

// Compared against when the email is unknown, so a wrong email and a wrong password
// take the same time and an attacker cannot discover which emails have accounts.
let dummyHash;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash('not-a-real-password-1', 12));

// One active session per user: issuing a refresh token replaces the previous one.
async function startSession(user) {
  const refresh = createRefreshToken();
  await User.updateOne(
    { _id: user._id },
    { $set: { refreshTokenHash: refresh.hash, refreshTokenExpiresAt: refresh.expiresAt } },
  );
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user),
    refreshToken: refresh.token,
    refreshExpiresAt: refresh.expiresAt,
  };
}

export async function register(fields) {
  const user = await createUser({ ...fields, role: 'customer' });
  return startSession(user);
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    await bcrypt.compare(password, await getDummyHash());
    throw invalidCredentials();
  }
  if (!(await user.comparePassword(password)) || !user.isActive) throw invalidCredentials();
  // Phase 6: the guest cart will be merged into the customer cart here.
  return startSession(user);
}

// Rotation: the old refresh token is swapped for a new one in a single atomic update,
// so a stolen token that was already used (or used twice at once) is rejected.
export async function refresh(token) {
  if (!token) throw invalidRefresh();
  const next = createRefreshToken();
  const user = await User.findOneAndUpdate(
    { refreshTokenHash: hashToken(token), refreshTokenExpiresAt: { $gt: new Date() }, isActive: true },
    { $set: { refreshTokenHash: next.hash, refreshTokenExpiresAt: next.expiresAt } },
    { returnDocument: 'after' },
  );
  if (!user) throw invalidRefresh();
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user),
    refreshToken: next.token,
    refreshExpiresAt: next.expiresAt,
  };
}

export async function logout(userId) {
  await User.updateOne({ _id: userId }, { $unset: { refreshTokenHash: 1, refreshTokenExpiresAt: 1 } });
}
