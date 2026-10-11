import React, { useEffect, useState } from 'react';
import { getInventory, restockIngredient, updateInventoryStock, resetInventoryToHealthyStock } from '../../lib/database';
import { getInventoryStatus } from '../../utils/analyticsUtils';
import { useAlerts } from '../../context/AlertContext';
import { supabase } from '../../lib/supabase';
import type { InventoryItem } from '../../types';
import { Plus, RefreshCw, AlertTriangle, Sparkles, Check, CheckCircle2 } from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState<Record<string, number>>({});
  const [resettingAll, setResettingAll] = useState(false);
  const { addAlert, refreshAlerts } = useAlerts();

  const fetchStock = async () => {
    setLoading(true);
    try {
      const data = await getInventory();
      if (data?.length) setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();

    // Listen for live database inventory updates whenever an order is placed
    const sub = supabase.channel('inventory_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchStock();
        refreshAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  useEffect(() => {
    items.forEach(item => {
      if (item.current_stock <= item.min_threshold) addAlert(item);
    });
  }, [items]);

  const handleRestock = async (item: InventoryItem) => {
    const amount = restockAmount[item.id] || 10;
    try {
      await restockIngredient(item.id, amount);
      await fetchStock();
      await refreshAlerts();
    } catch (e) {
      console.error(e);
    }
    setRestockingId(null);
  };

  const handleResetHealthyStock = async () => {
    setResettingAll(true);
    try {
      await resetInventoryToHealthyStock();
      await fetchStock();
      await refreshAlerts();
    } finally {
      setResettingAll(false);
    }
  };

  const lowStockItems = items.filter(i => i.current_stock <= i.min_threshold);

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-page-title">📦 Kitchen Inventory Management</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Live database stock automatically deducted when customer cake orders are placed
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handleResetHealthyStock}
            disabled={resettingAll}
            className="btn btn-sm"
            style={{ 
              background: '#16A34A', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              fontWeight: 700 
            }}
          >
            <Sparkles size={14} />
            {resettingAll ? 'Restocking All...' : '⚡ Reset All to Healthy Stock'}
          </button>
          <button 
            onClick={fetchStock} 
            className="btn btn-sm" 
            style={{ background: 'var(--cream)', color: 'var(--text-muted)' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Live
          </button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div style={{ 
          background: 'rgba(239,68,68,0.08)', 
          border: '1px solid rgba(239,68,68,0.2)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.25rem 1.5rem', 
          marginBottom: '1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem' 
        }}>
          <AlertTriangle size={24} color="#EF4444" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#DC2626', marginBottom: '0.25rem' }}>
              {lowStockItems.length} ingredient(s) below minimum safety threshold!
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {lowStockItems.map(i => `${i.name} (${i.current_stock} ${i.unit})`).join(', ')}
            </div>
          </div>
          <button
            onClick={handleResetHealthyStock}
            className="btn btn-sm"
            style={{ background: '#DC2626', color: 'white' }}
          >
            Replenish All Now
          </button>
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Current Stock</th>
              <th>Min Safety</th>
              <th>Stock Level (%)</th>
              <th>Status</th>
              <th>Unit Cost</th>
              <th>Restock Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const { label, color, pct } = getInventoryStatus(item.current_stock, item.min_threshold, item.max_capacity);
              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--chocolate)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Max: {item.max_capacity} {item.unit} · {item.supplier || 'Bakery Supply'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: item.current_stock <= item.min_threshold ? '#DC2626' : 'var(--chocolate)' }}>
                      {item.current_stock} {item.unit}
                    </div>
                    {item.updated_at && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Updated {new Date(item.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{item.min_threshold} {item.unit}</td>
                  <td style={{ minWidth: 150 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="stock-bar" style={{ flex: 1 }}>
                        <div className="stock-fill" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color, minWidth: 35 }}>{Math.round(pct)}%</span>
                    </div>
                  </td>
                  <td><span className="badge" style={{ background: `${color}20`, color, fontWeight: 700 }}>{label}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>₹{item.unit_cost}/{item.unit}</td>
                  <td>
                    {restockingId === item.id ? (
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input 
                          type="number" 
                          min={1} 
                          value={restockAmount[item.id] || 10} 
                          onChange={e => setRestockAmount(prev => ({ ...prev, [item.id]: Number(e.target.value) }))} 
                          className="input-field" 
                          style={{ width: 65, padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} 
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                        <button onClick={() => handleRestock(item)} className="btn btn-primary btn-sm" style={{ padding: '0.35rem 0.65rem' }}>
                          Add
                        </button>
                        <button onClick={() => setRestockingId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setRestockingId(item.id)} 
                        className="btn btn-sm" 
                        style={{ background: 'rgba(34,197,94,0.1)', color: '#16A34A', fontWeight: 600 }}
                      >
                        + Restock
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
