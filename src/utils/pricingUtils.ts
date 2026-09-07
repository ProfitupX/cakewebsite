import type { CakeCustomization, SalesDataPoint, DemandForecast } from '../types';

// ─── Price Calculation ────────────────────────────────────────────────────────
const SIZE_PRICES: Record<string, number> = {
  'Small (0.5kg)': 299,
  'Medium (1kg)': 499,
  'Large (2kg)': 799,
  'XLarge (3kg)': 1199,
};

const TIER_MULTIPLIER: Record<number, number> = { 1: 1, 2: 1.5, 3: 2.2 };

const FLAVOR_PREMIUM: Record<string, number> = {
  Chocolate: 50, Vanilla: 0, RedVelvet: 80,
  Strawberry: 60, Lemon: 40, Mango: 70,
};

const FROSTING_PREMIUM: Record<string, number> = {
  Buttercream: 0, Whipped: 20, Fondant: 150, Naked: -30,
};

const TOPPING_PREMIUM: Record<string, number> = {
  None: 0, Berries: 80, Sprinkles: 30, Flowers: 120, Drizzle: 50, Macarons: 200,
};

export function calculateCakePrice(customization: CakeCustomization): number {
  const base = SIZE_PRICES[customization.size] || 499;
  const tierMult = TIER_MULTIPLIER[customization.tiers] || 1;
  const flavorPrem = FLAVOR_PREMIUM[customization.flavor] || 0;
  const frostingPrem = FROSTING_PREMIUM[customization.frosting] || 0;
  const toppingPrem = TOPPING_PREMIUM[customization.topping] || 0;
  const messagePrem = customization.message ? 50 : 0;
  return Math.round((base * tierMult) + flavorPrem + frostingPrem + toppingPrem + messagePrem);
}

export function applyHappyHourDiscount(price: number, discountPercent: number): number {
  return Math.round(price * (1 - discountPercent / 100));
}

export function isHappyHourActive(
  startTime: string,
  endTime: string,
  daysOfWeek: number[]
): boolean {
  const now = new Date();
  const dayOk = daysOfWeek.includes(now.getDay());
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  return dayOk && nowMinutes >= startMinutes && nowMinutes < endMinutes;
}

export function getSecondsUntilHappyHourEnd(endTime: string): number {
  const now = new Date();
  const [h, m] = endTime.split(':').map(Number);
  const end = new Date(now);
  end.setHours(h, m, 0, 0);
  if (end < now) return 0;
  return Math.floor((end.getTime() - now.getTime()) / 1000);
}
