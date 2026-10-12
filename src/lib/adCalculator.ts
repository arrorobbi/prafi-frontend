/**
 * Ad budget & profit calculator for sellers (tenant dashboard → Kalkulator Profit & Iklan).
 * The formulas are fixed by the product owner: don't change them, only how the results are shown.
 */
export interface AdCalculatorInput {
  /** Selling price per unit (Rp) */
  price: number;
  /** Product cost per unit: COGS + packing (Rp) */
  cogs: number;
  /** Actual ad cost per sale: target CPA (Rp) */
  cpa: number;
  /** Estimated sales per month (units) */
  units: number;
}

export function calculateAdProfit({ price, cogs, cpa, units }: AdCalculatorInput) {
  const marginKotor = price - cogs;
  const maxCpa = marginKotor;
  const beRoas = marginKotor > 0 ? price / marginKotor : 0;
  const currentRoas = cpa > 0 ? price / cpa : 0;
  const netProfitUnit = marginKotor - cpa;
  const totalNetProfit = netProfitUnit * units;
  return { marginKotor, maxCpa, beRoas, currentRoas, netProfitUnit, totalNetProfit };
}
