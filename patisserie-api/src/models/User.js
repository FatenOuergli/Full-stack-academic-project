import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, TUNISIAN_PHONE_REGEX } from '../config/constants.js';
import { addressSchema } from './address.schema.js';

const BCRYPT_ROUNDS = 12;
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email is invalid'],
    },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    phone: {
      type: String,
      trim: true,
      match: [TUNISIAN_PHONE_REGEX, 'phone must be +216 followed by 8 digits'],
    },
    role: { type: String, enum: ROLES, default: 'customer' },
    addresses: { type: [addressSchema], default: [] },
    refreshTokenHash: { type: String, select: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Plain password is only ever held in memory: `user.password = '...'` then save().
userSchema.virtual('password').set(function setPassword(plain) {
  this._password = plain;
  this.passwordHash = 'pending-hash';
});

userSchema.pre('validate', function validatePassword() {
  if (this._password !== undefined && !PASSWORD_RULE.test(this._password)) {
    this.invalidate('password', 'password must be 8 to 72 characters with at least one letter and one digit');
  }
});

userSchema.pre('save', async function hashPassword() {
  if (this._password === undefined) return;
  this.passwordHash = await bcrypt.hash(this._password, BCRYPT_ROUNDS);
  this._password = undefined;
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
