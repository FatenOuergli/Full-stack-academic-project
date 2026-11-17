export const CURRENCY = 'TND';
export const STRIPE_CURRENCY = 'tnd';
export const MILLIMES_PER_DINAR = 1000;
// Prices are multiples of 100 millimes (0.100 DT), as in Tunisian shops.
export const PRICE_STEP_MILLIMES = 100;

export const ROLES = ['customer', 'admin'];

export const PRODUCT_UNITS = ['piece', 'box', 'kg'];

export const OCCASIONS = ['ramadan', 'aid', 'mouled', 'wedding'];

export const ORDER_STATUSES = ['pending', 'paid', 'preparing', 'ready', 'delivered', 'cancelled'];

export const PAYMENT_STATUSES = ['unpaid', 'paid', 'failed', 'refunded'];

export const PAYMENT_PROVIDERS = ['stripe', 'mock'];

export const PAYMENT_ATTEMPT_STATUSES = ['requires_payment', 'processing', 'succeeded', 'failed', 'canceled'];

export const GOVERNORATES = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan',
  'Kasserine', 'Kébili', 'Le Kef', 'Mahdia', 'La Manouba', 'Médenine', 'Monastir', 'Nabeul',
  'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
];

export const TUNISIAN_PHONE_REGEX = /^\+216\d{8}$/;
export const POSTAL_CODE_REGEX = /^\d{4}$/;

// 8 to 72 characters (bcrypt ignores bytes after 72), at least one letter and one digit.
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
export const PASSWORD_MESSAGE = 'password must be 8 to 72 characters with at least one letter and one digit';

export const GUEST_CART_TTL_SECONDS = 30 * 24 * 60 * 60;
