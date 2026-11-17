import { z } from 'zod';
import { PASSWORD_MESSAGE, PASSWORD_REGEX, TUNISIAN_PHONE_REGEX } from '../config/constants.js';

const email = z.email().max(254).transform((v) => v.trim().toLowerCase());
const name = z.string().trim().min(1).max(50);
export const password = z.string().regex(PASSWORD_REGEX, PASSWORD_MESSAGE);
export const phone = z.string().regex(TUNISIAN_PHONE_REGEX, 'phone must be +216 followed by 8 digits');

// Unknown fields such as "role" are removed by z.object, so nobody can register as admin.
export const registerBody = z.object({
  email,
  password,
  firstName: name,
  lastName: name,
  phone: phone.optional(),
});

export const loginBody = z.object({
  email,
  password: z.string().min(1).max(72),
});
