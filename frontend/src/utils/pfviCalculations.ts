export function calculate_df(pfvi_prev: number, temp_max: number, r0: number = 3000.0, dt: number = 1.0): number {
  const numerator = (300.0 - pfvi_prev) * (0.4982 * Math.exp(0.0905 * temp_max + 1.6096) - 4.268) * dt * 1e-3;
  const denominator = 1.0 + 10.88 * Math.exp(-0.00173582677165354 * r0);
  return numerator / denominator;
}

export function calculate_rf(rf_current: number, rf_prev: number | null): number {
  if (rf_prev === null || isNaN(rf_prev) || rf_prev <= 5.1) {
    if (rf_current < 5.1) {
      return 0.0;
    } else {
      return rf_current - 5.1;
    }
  } else {
    if (rf_current >= 5.1) {
      return rf_current;
    } else {
      return 0.0;
    }
  }
}

export function calculate_wtf(wt_depth: number, a_h: number, b_h: number, n: number, alpha: number): [number, number] {
  if (n <= 0 || alpha <= 0) return [0.0, 0.0];
  const m = 1.0 - (1.0 / n);
  const v = Math.max(0.0, wt_depth);
  const theta = Math.pow(1.0 + Math.pow(v / alpha, n), -m);
  const wtf = a_h - b_h * ((1.0 - theta) * 300.0);
  return [wtf, theta];
}
