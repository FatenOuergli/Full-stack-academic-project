import mongoose from 'mongoose';
import { GOVERNORATES, POSTAL_CODE_REGEX, TUNISIAN_PHONE_REGEX } from '../config/constants.js';

const baseFields = {
  street: { type: String, required: true, trim: true, maxlength: 200 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  governorate: { type: String, required: true, enum: GOVERNORATES },
  postalCode: {
    type: String,
    required: true,
    match: [POSTAL_CODE_REGEX, 'postalCode must be 4 digits'],
  },
  country: { type: String, default: 'TN', enum: ['TN'] },
};

// Saved address on a user profile.
export const addressSchema = new mongoose.Schema({
  label: { type: String, trim: true, maxlength: 50, default: 'Maison' },
  ...baseFields,
  isDefault: { type: Boolean, default: false },
});

// Delivery address copied into an order (snapshot, with the recipient).
export const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: {
      type: String,
      required: true,
      match: [TUNISIAN_PHONE_REGEX, 'phone must be +216 followed by 8 digits'],
    },
    ...baseFields,
  },
  { _id: false },
);
