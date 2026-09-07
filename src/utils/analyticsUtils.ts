import type { SalesDataPoint, DemandForecast } from '../types';

// ─── Aggregate raw orders into daily sales data points ───────────────────────
export function aggregateSalesData(
  orders: Array<{ created_at: string; total_amount: number }>
): SalesDataPoint[] {
  const map = new Map<string, { revenue: number; orders: number }>();
  for (const order of orders) {
    const date = order.created_at.split('T')[0];
    const existing = map.get(date) || { revenue: 0, orders: 0 };
    map.set(date, { revenue: existing.revenue + order.total_amount, orders: existing.orders + 1 });
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { revenue, orders }]) => ({
      date,
      revenue: Math.round(revenue),
      orders,
      avg_order_value: orders > 0 ? Math.round(revenue / orders) : 0,
    }));
}

// ─── Simple Moving Average Demand Forecast ────────────────────────────────────
// Uses last N days of data to compute rolling average and project next 7 days
export function computeMovingAverageForecast(
  data: SalesDataPoint[],
  windowSize = 7
): SalesDataPoint[] {
  if (data.length < 2) return [];
  const forecasts: SalesDataPoint[] = [];
  const lastDate = new Date(data[data.length - 1].date);

  for (let i = 1; i <= 7; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);

    const windowData = data.slice(-Math.min(windowSize, data.length));
    const avgRevenue = windowData.reduce((s, d) => s + d.revenue, 0) / windowData.length;
    const avgOrders = windowData.reduce((s, d) => s + d.orders, 0) / windowData.length;

    // Apply slight growth/decay trend using linear regression slope
    const trend = computeTrendSlope(windowData.map(d => d.revenue));
    const projectedRevenue = Math.max(0, Math.round(avgRevenue + trend * i));
    const projectedOrders = Math.max(0, Math.round(avgOrders + (computeTrendSlope(windowData.map(d => d.orders))) * i));

    forecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      revenue: projectedRevenue,
      orders: projectedOrders,
      avg_order_value: projectedOrders > 0 ? Math.round(projectedRevenue / projectedOrders) : 0,
    });
  }
  return forecasts;
}

function computeTrendSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;
  let numerator = 0, denominator = 0;
  values.forEach((y, x) => {
    numerator += (x - xMean) * (y - yMean);
    denominator += (x - xMean) ** 2;
  });
  return denominator !== 0 ? numerator / denominator : 0;
}

// ─── Product Demand Forecast ───────────────────────────────────────────────────
export function computeProductDemandForecast(
  historicalData: SalesDataPoint[],
  productNames: string[]
): DemandForecast[] {
  // Since we aggregate total sales, distribute proportionally as demo
  if (historicalData.length < 2) {
    return productNames.map((name, i) => ({
      product_name: name,
      current_demand: Math.floor(Math.random() * 20) + 5,
      predicted_demand: Math.floor(Math.random() * 25) + 8,
      trend: 'stable',
      confidence: 75,
    }));
  }

  const recent = historicalData.slice(-7);
  const prior = historicalData.slice(-14, -7);
  const recentAvgOrders = recent.reduce((s, d) => s + d.orders, 0) / (recent.length || 1);
  const priorAvgOrders = prior.length > 0 ? prior.reduce((s, d) => s + d.orders, 0) / prior.length : recentAvgOrders;

  const totalRecentOrders = Math.round(recentAvgOrders * 7);
  const weights = [0.25, 0.18, 0.15, 0.12, 0.10, 0.10, 0.10];

  return productNames.map((name, i) => {
    const weight = weights[i % weights.length];
    const currentDemand = Math.round(totalRecentOrders * weight);
    const growthFactor = priorAvgOrders > 0 ? recentAvgOrders / priorAvgOrders : 1;
    const predictedDemand = Math.round(currentDemand * growthFactor * (0.9 + Math.random() * 0.2));
    const trend = predictedDemand > currentDemand * 1.05 ? 'up' : predictedDemand < currentDemand * 0.95 ? 'down' : 'stable';
    const confidence = Math.round(70 + Math.random() * 20);
    return { product_name: name, current_demand: currentDemand, predicted_demand: predictedDemand, trend, confidence };
  });
}

// ─── Inventory Status Helpers ─────────────────────────────────────────────────
export function getInventoryStatus(current: number, minThreshold: number, maxCapacity: number) {
  const pct = (current / maxCapacity) * 100;
  if (current === 0) return { label: 'Out of Stock', color: '#EF4444', pct: 0 };
  if (current <= minThreshold) return { label: 'Critical', color: '#F97316', pct };
  if (pct < 40) return { label: 'Low', color: '#EAB308', pct };
  if (pct < 75) return { label: 'Good', color: '#22C55E', pct };
  return { label: 'Full', color: '#3B82F6', pct };
}
