/**
 * Shared per-day rental pricing calculator.
 *
 * Supports two modes:
 *  - Flat:     total = basePricePerDay + (dailyRate × days)
 *  - Declining: day 1 uses firstDayRate; days 2+ start at dailyRate and decline
 *               by a flat amount or percentage each day until reaching minimumDailyRate.
 *
 * All monetary values are in CENTS (integers).
 */

export interface PerDayConfig {
  /** Delivery / setup fee in cents. Always added once regardless of mode. */
  basePricePerDay: number | null;
  /**
   * Flat mode: the per-day rate for every day.
   * Declining mode: the starting rate for day 2 onward (before decline).
   */
  dailyRate: number | null;
  /** If set, enables declining mode. Rate charged specifically for day 1. */
  firstDayRate: number | null;
  /** 'flat' | 'percent' | null */
  rateDeclineType: string | null;
  /**
   * How much to reduce the rate each day (days 2+):
   *  - 'flat':    cents to subtract per day (e.g. $10 = 1000)
   *  - 'percent': basis points (e.g. 5% = 500)
   */
  rateDeclineAmount: number | null;
  /** Floor rate in cents — the rate never goes below this value. */
  minimumDailyRate: number | null;
}

export interface DayRate {
  day: number;
  /** Rate for this specific day in cents. */
  rate: number;
}

export interface PerDayResult {
  /** Delivery/setup fee in cents (= basePricePerDay ?? 0). */
  deliveryFee: number;
  /** Rental-only subtotal in cents (excludes deliveryFee). */
  rentalTotal: number;
  /** deliveryFee + rentalTotal */
  grandTotal: number;
  /** true when firstDayRate is set and declining mode is active. */
  isDeclineMode: boolean;
  /** Per-day rate breakdown (length === days). */
  breakdown: DayRate[];
}

export function calculatePerDayRental(config: PerDayConfig, days: number): PerDayResult {
  const deliveryFee = config.basePricePerDay ?? 0;
  const isDeclineMode = config.firstDayRate != null;
  const floor = config.minimumDailyRate ?? 0;

  const breakdown: DayRate[] = [];

  if (isDeclineMode) {
    // Day 1: firstDayRate (always the fixed special rate)
    breakdown.push({ day: 1, rate: config.firstDayRate! });

    // Days 2+: start at dailyRate and decline each day
    let rate = config.dailyRate ?? 0;
    for (let day = 2; day <= days; day++) {
      const effectiveRate = Math.max(floor, rate);
      breakdown.push({ day, rate: effectiveRate });

      // Apply decline for next iteration
      if (config.rateDeclineType === 'flat') {
        rate = Math.max(floor, rate - (config.rateDeclineAmount ?? 0));
      } else if (config.rateDeclineType === 'percent') {
        // basis points: 500 = 5%
        const bps = config.rateDeclineAmount ?? 0;
        rate = Math.max(floor, Math.round(rate * (10000 - bps) / 10000));
      }
      // If no decline type, rate stays constant
    }
  } else {
    // Flat mode: every day charged at dailyRate
    const flatRate = config.dailyRate ?? 0;
    for (let day = 1; day <= days; day++) {
      breakdown.push({ day, rate: flatRate });
    }
  }

  const rentalTotal = breakdown.reduce((sum, d) => sum + d.rate, 0);

  return {
    deliveryFee,
    rentalTotal,
    grandTotal: deliveryFee + rentalTotal,
    isDeclineMode,
    breakdown,
  };
}

/**
 * Returns a human-readable summary of the declining rate schedule.
 * e.g. "Day 1: $300, Days 2–7: $100→$90→$80→$70→$60→$50"
 */
export function formatDeclineSchedule(result: PerDayResult): string {
  if (!result.isDeclineMode || result.breakdown.length === 0) return '';

  const day1 = result.breakdown[0];
  const rest = result.breakdown.slice(1);

  const day1Str = `Day 1: $${(day1.rate / 100).toFixed(2)}`;
  if (rest.length === 0) return day1Str;

  const restStr = rest.map((d) => `$${(d.rate / 100).toFixed(2)}`).join('→');
  const lastDay = result.breakdown[result.breakdown.length - 1].day;
  return `${day1Str}, Days 2–${lastDay}: ${restStr}`;
}
