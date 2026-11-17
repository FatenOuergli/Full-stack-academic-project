import { z } from 'zod';
import { GOVERNORATES, POSTAL_CODE_REGEX, ROLES } from '../config/constants.js';
import { phone, registerBody } from './auth.validators.js';

export const MAX_ADDRESSES = 5;

const address = z.object({
  label: z.string().trim().min(1).max(50).optional(),
  street: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  governorate: z.enum(GOVERNORATES),
  postalCode: z.string().regex(POSTAL_CODE_REGEX, 'postalCode must be 4 digits'),
  isDefault: z.boolean().optional(),
});

// email, role and password are not editable here (they are stripped).
export const updateMeBody = z
  .object({
    firstName: z.string().trim().min(1).max(50).optional(),
    lastName: z.string().trim().min(1).max(50).optional(),
    phone: phone.nullable().optional(),
    addresses: z
      .array(address)
      .max(MAX_ADDRESSES)
      .refine((list) => list.filter((a) => a.isDefault).length <= 1, 'only one address can be the default')
      .optional(),
  })
  .refine((b) => Object.keys(b).length > 0, 'send at least one field to update');

export const listUsersQuery = z.object({
  role: z.enum(ROLES).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createAdminBody = registerBody;
