import mongoose from 'mongoose';
import { GUEST_CART_TTL_SECONDS } from '../config/constants.js';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'quantity must be an integer' },
    },
  },
  { _id: false },
);

// One cart per customer (user) or per visitor (guestId), never both.
const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestId: { type: String },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

// Partial filters on the type (not sparse/$exists) so a stored null never counts as an owner.
cartSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } });
cartSchema.index({ guestId: 1 }, { unique: true, partialFilterExpression: { guestId: { $type: 'string' } } });
// Guest carts expire after 30 days without changes; customer carts are kept.
cartSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: GUEST_CART_TTL_SECONDS, partialFilterExpression: { guestId: { $type: 'string' } } },
);

cartSchema.pre('validate', function checkOwner() {
  const hasUser = Boolean(this.user);
  const hasGuest = Boolean(this.guestId);
  if (hasUser === hasGuest) {
    this.invalidate('user', 'a cart belongs to exactly one of user or guestId');
  }
});

export const Cart = mongoose.model('Cart', cartSchema);
