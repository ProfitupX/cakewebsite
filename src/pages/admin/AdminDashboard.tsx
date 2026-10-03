import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Sparkles, RefreshCw, Plus, PackageCheck, ChefHat } from 'lucide-react';
import SalesChart from '../../components/charts/SalesChart';
import AICakeCalculator from '../../components/cake/AICakeCalculator';
import { getDashboardKPIs, getSalesData, getOrders, getInventory, deductInventoryForOrder } from '../../lib/database';
import { predictDemandAndRestockWithAI } from '../../lib/gemini';
import { aggregateSalesData, computeMovingAverageForecast } from '../../utils/analyticsUtils';
import { supabase } from '../../lib/supabase';
import { useAlerts } from '../../context/AlertContext';
import type { DashboardKPIs, Order, InventoryItem, SalesDataPoint, AIDemandForecastInsight, AICakeCalculation } from '../../types';

const INITIAL_KPIs: DashboardKPIs = {
  totalRevenue: 0, totalOrders: 0, pendingOrders: 0, lowStockCount: 0, revenueGrowth: 0, ordersGrowth: 0,
};

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs>(INITIAL_KPIs);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [forecast, setForecast] = useState<SalesDataPoint[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [aiInsight, setAiInsight] = useState<AIDemandForecastInsight | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(true);

  const { lowStockItems, quickRestock, refreshAlerts } = useAlerts();

  const fetchData = async () => {
    try {
      const [kpiRes, rawSales, ordersRes, invRes] = await Promise.all([
        getDashboardKPIs().catch(() => INITIAL_KPIs),
        getSalesData(30).catch(() => []),
        getOrders().catch(() => []),
        getInventory().catch(() => []),
      ]);

      setKpis(kpiRes);
      setOrders(ordersRes);
      setInventory(invRes);

      const agg = aggregateSalesData(rawSales);
      if (agg.length > 0) {
        setSalesData(agg);
        setForecast(computeMovingAverageForecast(agg));
      }

      // Run Gemini AI Demand & Restock insight
      setLoadingAI(true);
      predictDemandAndRestockWithAI(agg, invRes)
        .then(insight => setAiInsight(insight))
        .finally(() => setLoadingAI(false));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for real-time updates when an order is placed or inventory changes
    const sub = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
        refreshAlerts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchData();
        refreshAlerts();
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const handleManualDeductFromAI = async (calc: AICakeCalculation) => {
    await deductInventoryForOrder([{
      is_custom: true,
      quantity: 1,
      customization: {
        flavor: calc.flavor as any,
        tiers: calc.tiers as any,
        frosting: calc.frosting as any,
        topping: calc.topping as any,
        size: 'Medium (1kg)',
      },
    }]);
    await fetchData();
    await refreshAlerts();
  };

  const kpiCards = [
    { label: 'Revenue (This Month)', value: `₹${kpis.totalRevenue.toLocaleString()}`, change: kpis.revenueGrowth, icon: '💰', color: '#E8194B' },
    { label: 'Total Orders', value: kpis.totalOrders, change: kpis.ordersGrowth, icon: '📦', color: '#3B82F6' },
    { label: 'Pending Orders', value: kpis.pendingOrders, icon: '⏳', color: '#D97706' },
    { label: 'Low Stock Items', value: lowStockItems.length || kpis.lowStockCount, icon: '⚠️', color: '#EF4444' },
  ];

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-page-title">📊 Smart Kitchen Dashboard</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Automated cake ingredient calculation, AI demand forecasting & live stock monitoring
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={fetchData} className="btn btn-sm" style={{ background: 'var(--cream)', color: 'var(--text-muted)' }}>
            <RefreshCw size={14} /> Refresh Live
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── URGENT LOW STOCK ALERT BANNER ──────────────────────── */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%)',
            border: '2px solid #EF4444',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, color: '#B91C1C', fontSize: '1.05rem', fontWeight: 800 }}>
                  Low Kitchen Stock Alert ({lowStockItems.length} Ingredients Critical)
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
                  Ingredients below safety threshold. Restock immediately to avoid production delays.
                </p>
              </div>
            </div>
            <a href="/admin/inventory" className="btn btn-sm" style={{ background: '#DC2626', color: 'white' }}>
              Manage Inventory →
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {lowStockItems.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--chocolate)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#DC2626', fontWeight: 600 }}>
                    {item.current_stock} {item.unit} (Min: {item.min_threshold} {item.unit})
                  </div>
                </div>
                <button
                  onClick={() => quickRestock(item.id, 10)}
                  className="btn btn-sm"
                  style={{ background: '#16A34A', color: 'white', fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                >
                  <Plus size={12} /> +10 Restock
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="kpi-card">
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

      {/* ── AI KITCHEN DEMAND INTELLIGENCE (GEMINI FLASH) ──────── */}
      {aiInsight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #1A0A00 0%, #3D1A00 60%, #7B1A30 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            color: 'white',
            marginBottom: '2rem',
            boxShadow: '0 16px 40px rgba(26,10,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color="#FFD166" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'white', fontFamily: 'Playfair Display, serif' }}>
                  Gemini AI Kitchen Intelligence & Demand Predictor
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>
                  Automated sales analysis & ingredient replenishment planning
                </span>
              </div>
            </div>
            <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
              ⚡ Low-Token AI Model
            </span>
          </div>

          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {aiInsight.summary}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Top Demanded Cakes */}
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem' }}>
              <h4 style={{ color: '#FFD166', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ChefHat size={16} /> Predicted High-Demand Products
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {aiInsight.top_demanded_cakes.map((cake, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span>{cake.name}</span>
                    <span style={{ color: '#FFD166', fontWeight: 700 }}>
                      ~{cake.predicted_units} orders {cake.trend === 'up' ? '📈' : '➡️'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Baker Instructions */}
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem' }}>
              <h4 style={{ color: '#FFD166', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PackageCheck size={16} /> Kitchen Recommendation
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
                {aiInsight.baker_recommendation}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sales Chart */}
      <div className="chart-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Revenue & Sales Trend — Actual vs 7-Day Forecast</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Automated demand estimation and revenue tracking</span>
          </div>
          <span className="badge badge-rose" style={{ fontSize: '0.75rem' }}>Moving Average Model</span>
        </div>
        <SalesChart actual={salesData} forecast={forecast} />
      </div>

      {/* AI Kitchen Recipe Calculator Widget */}
      <div style={{ marginBottom: '2rem' }}>
        <AICakeCalculator
          cakeName="Artisan Chocolate Truffle & Custom Cake Spec"
          weightKg={2}
          customization={{
            flavor: 'Chocolate',
            tiers: 2,
            frosting: 'Buttercream',
            topping: 'Berries',
            size: 'Large (2kg)',
            message: 'Happy Birthday!',
          }}
          showDeductButton={true}
          onDeductInventory={handleManualDeductFromAI}
        />
      </div>

      {/* Recent Orders */}
      <div className="table-wrapper">
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', margin: 0 }}>Live Customer Orders</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Auto-deducts kitchen inventory in real-time</span>
          </div>
          <a href="/admin/orders" style={{ color: 'var(--rose)', fontSize: '0.85rem', fontWeight: 600 }}>View All Orders →</a>
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
            {orders.slice(0, 8).map(order => (
              <tr key={order.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{order.id.slice(0, 8).toUpperCase()}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{order.profile?.full_name || (order.user_id ? 'Customer' : 'Guest Customer')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {order.profile?.email || (order.delivery_address ? `📍 ${order.delivery_address}` : 'Guest Order')}
                  </div>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--rose)' }}>₹{order.total_amount?.toLocaleString()}</td>
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
        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📦</div>
            <p>No orders yet. When an order is placed, it will automatically appear here and deduct ingredients from the database!</p>
          </div>
        )}
      </div>
    </div>
  );
}
