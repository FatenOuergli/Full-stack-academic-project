import mongoose from 'mongoose';
import { OCCASIONS, PRODUCT_UNITS } from '../config/constants.js';
import { isValidPriceMillimes } from '../utils/money.js';
import { slugify } from '../utils/slugify.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 2000 },
    priceMillimes: {
      type: Number,
      required: true,
      validate: {
        validator: isValidPriceMillimes,
        message: 'priceMillimes must be a non-negative integer, multiple of 100',
      },
    },
    // Price and stock are both expressed per unit: one piece, one box or one kg.
    unit: { type: String, enum: PRODUCT_UNITS, required: true, default: 'piece' },
    weightGrams: {
      type: Number,
      min: 1,
      validate: { validator: Number.isInteger, message: 'weightGrams must be an integer' },
      required: [function requiredForBox() { return this.unit === 'box'; }, 'weightGrams is required for boxes'],
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: { validator: Number.isInteger, message: 'stock must be an integer' },
    },
    images: { type: [String], default: [] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    occasions: { type: [{ type: String, enum: OCCASIONS }], default: [] },
    isActive: { type: Boolean, default: true },
    ingredients: { type: [String], default: [] },
    allergens: { type: [String], default: [] },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ occasions: 1 });

productSchema.pre('validate', function setSlug() {
  if (!this.slug && this.name) this.slug = slugify(this.name);
});

export const Product = mongoose.model('Product', productSchema);
