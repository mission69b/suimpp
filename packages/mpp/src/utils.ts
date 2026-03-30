/**
 * Parse a string amount to raw bigint units without floating-point math.
 * "0.01" with 6 decimals → 10000n
 */
export function parseAmountToRaw(amount: string, decimals: number): bigint {
  const [whole = '0', frac = ''] = amount.split('.');
  const paddedFrac = frac.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFrac);
}
