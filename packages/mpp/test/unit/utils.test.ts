import { describe, expect, it } from 'vitest';
import {
  SUI_DOLLAR,
  SUI_DOLLAR_TYPE,
  USDC,
  USDC_TESTNET,
} from '../../src/constants.js';
import { parseAmountToRaw } from '../../src/utils.js';

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

describe('known currencies', () => {
  it('exports individual Currency presets', () => {
    expect(USDC).toMatchObject({ decimals: 6 });
    expect(USDC_TESTNET).toMatchObject({ decimals: 6 });
    expect(SUI_DOLLAR).toEqual({
      type: SUI_DOLLAR_TYPE,
      decimals: 6,
    });
  });
});
