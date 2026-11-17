import mongoose from 'mongoose';
import { CURRENCY, ORDER_STATUSES, PAYMENT_STATUSES, PRODUCT_UNITS } from '../config/constants.js';
import { isValidPriceMillimes } from '../utils/money.js';
import { shippingAddressSchema } from './address.schema.js';

// Allowed moves: statuses only go forward; cancelled only from pending or paid.
export const ORDER_TRANSITIONS = Object.freeze({
  pending: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
});

// Snapshot of the product at purchase time, so later price changes do not alter history.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    unit: { type: String, enum: PRODUCT_UNITS, required: true },
    priceMillimes: {
      type: Number,
      required: true,
      validate: { validator: isValidPriceMillimes, message: 'priceMillimes must be a multiple of 100' },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'quantity must be an integer' },
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, match: /^PAT-\d{4}-\d{6}$/ },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestEmail: { type: String, lowercase: true, trim: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (items) => items.length > 0, message: 'an order needs at least one item' },
    },
    totalMillimes: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: [CURRENCY], default: CURRENCY, immutable: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid' },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.statics.canTransition = function canTransition(from, to) {
  return (ORDER_TRANSITIONS[from] || []).includes(to);
};

orderSchema.pre('validate', function checkOrder() {
  if (!this.user && !this.guestEmail) {
    this.invalidate('user', 'an order belongs to a user or a guest email');
  }
  const computed = (this.items || []).reduce((sum, i) => sum + i.priceMillimes * i.quantity, 0);
  if (this.totalMillimes !== computed) {
    this.invalidate('totalMillimes', `totalMillimes must equal the sum of the items (${computed})`);
  }
});

export const Order = mongoose.model('Order', orderSchema);
