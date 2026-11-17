import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex } from '../utils/escapeRegex.js';

// The only user shape that leaves the API: no password hash, no token hash, no __v.
export function toPublicUser(u) {
  return {
    id: u._id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    addresses: (u.addresses || []).map((a) => ({
      id: a._id,
      label: a.label,
      street: a.street,
      city: a.city,
      governorate: a.governorate,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
    })),
    createdAt: u.createdAt,
  };
}

// Turns MongoDB's duplicate-key error on email into a clear 409.
export async function createUser(fields) {
  try {
    return await User.create(fields);
  } catch (err) {
    if (err?.code === 11000 && err.keyPattern?.email) {
      throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }
    throw err;
  }
}

async function findActiveUser(id) {
  const user = await User.findById(id);
  if (!user || !user.isActive) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  return user;
}

export async function getMe(userId) {
  return toPublicUser(await findActiveUser(userId));
}

export async function updateMe(userId, changes) {
  const user = await findActiveUser(userId);
  const { addresses, phone, ...names } = changes;
  user.set(names);
  if (phone !== undefined) user.phone = phone ?? undefined;
  if (addresses !== undefined) {
    // With saved addresses, exactly one is the default (the first one if none was chosen).
    const hasDefault = addresses.some((a) => a.isDefault);
    user.addresses = addresses.map((a, i) => ({ ...a, isDefault: hasDefault ? Boolean(a.isDefault) : i === 0 }));
  }
  await user.save();
  return toPublicUser(user);
}

export async function listUsers({ role, search, page, limit }) {
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ email: pattern }, { firstName: pattern }, { lastName: pattern }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return { data: users.map(toPublicUser), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// Business rule 10: only an existing admin creates another admin (no self-registration).
export async function createAdmin(fields) {
  return toPublicUser(await createUser({ ...fields, role: 'admin' }));
}
