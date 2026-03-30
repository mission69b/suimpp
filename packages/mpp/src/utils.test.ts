import { describe, it, expect } from 'vitest';
import { parseAmountToRaw } from './utils.js';

describe('parseAmountToRaw', () => {
  it('converts whole number', () => {
    expect(parseAmountToRaw('1', 6)).toBe(1_000_000n);
  });

  it('converts cents', () => {
    expect(parseAmountToRaw('0.01', 6)).toBe(10_000n);
  });

  it('converts smallest USDC unit', () => {
    expect(parseAmountToRaw('0.000001', 6)).toBe(1n);
  });

  it('converts dollars and cents', () => {
    expect(parseAmountToRaw('100.50', 6)).toBe(100_500_000n);
  });

  it('truncates below precision', () => {
    expect(parseAmountToRaw('0.0000001', 6)).toBe(0n);
  });
});
