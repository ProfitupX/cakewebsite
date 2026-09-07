import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ShoppingBag, Package, DollarSign, Clock } from 'lucide-react';
import SalesChart from '../../components/charts/SalesChart';
import { getDashboardKPIs, getSalesData, getOrders, getInventory } from '../../lib/database';
import { aggregateSalesData, computeMovingAverageForecast, getInventoryStatus } from '../../utils/analyticsUtils';
import { supabase } from '../../lib/supabase';
import type { DashboardKPIs, Order, InventoryItem, SalesDataPoint } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#D97706', confirmed: '#2563EB', baking: '#DB2777', ready: '#059669', delivered: '#6B7280', cancelled: '#DC2626',
};

// Initial empty state
const INITIAL_KPIs: DashboardKPIs = {
  totalRevenue: 0, totalOrders: 0, pendingOrders: 0, lowStockCount: 0, revenueGrowth: 0, ordersGrowth: 0,
};

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs>(INITIAL_KPIs);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [forecast, setForecast] = useState<SalesDataPoint[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        getDashboardKPIs().then(setKpis).catch(() => {}),
        getSalesData(30).then(raw => {
          const agg = aggregateSalesData(raw);
          if (agg.length > 0) { setSalesData(agg); setForecast(computeMovingAverageForecast(agg)); }
        }).catch(() => {}),
        getOrders().then(setOrders).catch(() => {}),
      ]).finally(() => setLoading(false));
    };

    fetchData();

    // Listen for real-time updates when an order is placed
    const sub = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const kpiCards = [
    { label: 'Revenue (This Month)', value: `₹${kpis.totalRevenue.toLocaleString()}`, change: kpis.revenueGrowth, icon: '💰', color: '#E8194B' },
    { label: 'Total Orders', value: kpis.totalOrders, change: kpis.ordersGrowth, icon: '📦', color: '#3B82F6' },
    { label: 'Pending Orders', value: kpis.pendingOrders, icon: '⏳', color: '#D97706' },
    { label: 'Low Stock Items', value: kpis.lowStockCount, icon: '⚠️', color: '#EF4444' },
  ];

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-page-title">📊 Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="kpi-card">
            <div className="kpi-icon" style={{ background: `${card.color}15` }}>
              <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
            </div>
            <div className="kpi-value">{card.value}</div>
            <div className="kpi-label">{card.label}</div>
            {card.change !== undefined && (
              <div className={`kpi-change ${card.change >= 0 ? 'positive' : 'negative'}`}>
                {card.change >= 0 ? <TrendingUp size={14} style={{ display: 'inline', marginRight: 2 }} /> : <TrendingDown size={14} style={{ display: 'inline', marginRight: 2 }} />}
                {Math.abs(card.change).toFixed(1)}% vs last month
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Sales Chart */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3>Revenue Trend — Actual vs 7-Day Forecast</h3>
          <span className="badge badge-rose" style={{ fontSize: '0.75rem' }}>Moving Average Model</span>
        </div>
        <SalesChart actual={salesData} forecast={forecast} />
      </div>

      {/* Recent Orders */}
      <div className="table-wrapper">
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem' }}>Recent Orders</h3>
          <a href="/admin/orders" style={{ color: 'var(--rose)', fontSize: '0.85rem', fontWeight: 600 }}>View All →</a>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map(order => (
              <tr key={order.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{order.id.slice(0, 8).toUpperCase()}</td>
                <td>{order.profile?.full_name || 'Customer'}</td>
                <td style={{ fontWeight: 700 }}>₹{order.total_amount?.toLocaleString()}</td>
                <td>
                  <span className={`status-chip status-${order.status}`}>
                    ● {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {new Date(order.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
