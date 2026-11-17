import mongoose from 'mongoose';
import { PAYMENT_ATTEMPT_STATUSES, PAYMENT_PROVIDERS, STRIPE_CURRENCY } from '../config/constants.js';

// One payment attempt for an order. Card data is never stored here.
const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    provider: { type: String, enum: PAYMENT_PROVIDERS, default: 'stripe' },
    stripePaymentIntentId: { type: String },
    amountMillimes: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'amountMillimes must be an integer' },
    },
    currency: { type: String, enum: [STRIPE_CURRENCY], default: STRIPE_CURRENCY },
    status: { type: String, enum: PAYMENT_ATTEMPT_STATUSES, default: 'requires_payment' },
    lastEvent: { type: String },
    // Webhook event ids already applied, so a replayed event changes nothing.
    processedEventIds: { type: [String], default: [], select: false },
  },
  { timestamps: true },
);

paymentSchema.index({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ order: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
