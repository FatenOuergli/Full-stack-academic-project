import { MILLIMES_PER_DINAR, PRICE_STEP_MILLIMES } from '../config/constants.js';

export function isValidPriceMillimes(value) {
  return Number.isInteger(value) && value >= 0 && value % PRICE_STEP_MILLIMES === 0;
}

export function dinarsToMillimes(dinars) {
  return Math.round(dinars * MILLIMES_PER_DINAR);
}

// 18500 -> "18.500 DT"
export function formatTND(millimes) {
  return `${(millimes / MILLIMES_PER_DINAR).toFixed(3)} DT`;
}
