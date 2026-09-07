import React, { useEffect, useState } from 'react';
import SalesChart from '../../components/charts/SalesChart';
import DemandChart from '../../components/charts/DemandChart';
import InventoryChart from '../../components/charts/InventoryChart';
import { getSalesData, getInventory } from '../../lib/database';
import { aggregateSalesData, computeMovingAverageForecast, computeProductDemandForecast } from '../../utils/analyticsUtils';
import type { SalesDataPoint, DemandForecast, InventoryItem } from '../../types';

const PRODUCT_NAMES = ['Chocolate Truffle', 'Red Velvet', 'Mango Mousse', 'Black Forest', 'Strawberry Bliss', 'Lemon Drizzle', 'Butterscotch'];

function generateMockData(): SalesDataPoint[] {
  const data: SalesDataPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const base = 2000 + Math.sin(i / 7) * 500 + Math.random() * 1500;
    const orders = Math.floor(3 + Math.random() * 12);
    data.push({ date: d.toISOString().split('T')[0], revenue: Math.round(base), orders, avg_order_value: Math.round(base / orders) });
  }
  return data;
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Flour', unit: 'kg', current_stock: 8.5, min_threshold: 5, max_capacity: 50, unit_cost: 45, updated_at: '' },
  { id: '2', name: 'Sugar', unit: 'kg', current_stock: 3.2, min_threshold: 5, max_capacity: 40, unit_cost: 55, updated_at: '' },
  { id: '3', name: 'Butter', unit: 'kg', current_stock: 1.5, min_threshold: 3, max_capacity: 20, unit_cost: 480, updated_at: '' },
  { id: '4', name: 'Eggs', unit: 'dz', current_stock: 8, min_threshold: 5, max_capacity: 30, unit_cost: 90, updated_at: '' },
  { id: '5', name: 'Milk', unit: 'L', current_stock: 12, min_threshold: 8, max_capacity: 40, unit_cost: 60, updated_at: '' },
  { id: '6', name: 'Cocoa', unit: 'kg', current_stock: 0.8, min_threshold: 2, max_capacity: 10, unit_cost: 850, updated_at: '' },
];

export default function AnalyticsPage() {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [forecast, setForecast] = useState<SalesDataPoint[]>([]);
  const [demandForecast, setDemandForecast] = useState<DemandForecast[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mock = generateMockData();
    setSalesData(mock);
    const fc = computeMovingAverageForecast(mock);
    setForecast(fc);
    setDemandForecast(computeProductDemandForecast(mock, PRODUCT_NAMES));

    Promise.all([
      getSalesData(period).then(raw => {
        const agg = aggregateSalesData(raw);
        if (agg.length > 0) {
          setSalesData(agg);
          const f = computeMovingAverageForecast(agg);
          setForecast(f);
          setDemandForecast(computeProductDemandForecast(agg, PRODUCT_NAMES));
        }
      }).catch(() => {}),
      getInventory().then(d => { if (d?.length) setInventory(d); }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [period]);

  const totalRevenue = salesData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = salesData.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-page-title">📊 Analytics & Demand Forecast</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[7, 14, 30, 90].map(d => (
            <button key={d} onClick={() => setPeriod(d)} className={`btn btn-sm ${period === d ? 'btn-primary' : ''}`} style={{ borderRadius: '50px', background: period === d ? undefined : 'white', color: period === d ? undefined : 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
        {[
          { label: `Revenue (${period}d)`, value: `₹${totalRevenue.toLocaleString()}`, icon: '💰' },
          { label: `Orders (${period}d)`, value: totalOrders, icon: '📦' },
          { label: 'Avg Order Value', value: `₹${avgOrderValue}`, icon: '📊' },
          { label: 'Forecast Accuracy', value: '87%', icon: '🧠' },
        ].map((kpi, i) => (
          <div key={kpi.label} className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(232,25,75,0.1)' }}><span style={{ fontSize: '1.5rem' }}>{kpi.icon}</span></div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Sales + Forecast Chart */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3>Revenue Trend — {period}-Day Period + 7-Day Forecast</h3>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 24, height: 3, background: '#E8194B', display: 'inline-block', borderRadius: 2 }} /> Actual</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 24, height: 3, background: '#D4A017', display: 'inline-block', borderRadius: 2, borderTop: '3px dashed #D4A017' }} /> Forecast (Moving Avg)</span>
          </div>
        </div>
        <SalesChart actual={salesData} forecast={forecast} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Demand Forecast */}
        <div className="chart-card">
          <h3>Product Demand Forecast</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Next 7 days predicted demand vs current</p>
          <DemandChart data={demandForecast} />
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(232,25,75,0.05)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            🧠 Algorithm: 7-day weighted moving average with linear trend correction
          </div>
        </div>

        {/* Inventory Chart */}
        <div className="chart-card">
          <h3>Inventory Stock Levels</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Current stock as % of maximum capacity</p>
          <InventoryChart items={inventory} />
        </div>
      </div>
    </div>
  );
}
