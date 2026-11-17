import { dinarsToMillimes, formatTND, isValidPriceMillimes } from '../src/utils/money.js';

describe('money helpers (TND, 3 decimals)', () => {
  it('formats millimes as dinars', () => {
    expect(formatTND(18500)).toBe('18.500 DT');
    expect(formatTND(1200)).toBe('1.200 DT');
  });

  it('converts dinars to integer millimes', () => {
    expect(dinarsToMillimes(18.5)).toBe(18500);
    expect(dinarsToMillimes(0.1)).toBe(100);
  });

  it('validates prices', () => {
    expect(isValidPriceMillimes(26000)).toBe(true);
    expect(isValidPriceMillimes(26050)).toBe(false);
    expect(isValidPriceMillimes(-100)).toBe(false);
    expect(isValidPriceMillimes(12.5)).toBe(false);
  });
});
