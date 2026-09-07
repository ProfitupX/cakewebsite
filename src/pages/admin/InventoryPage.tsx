import React, { useEffect, useState } from 'react';
import { getInventory, restockIngredient, updateInventoryStock } from '../../lib/database';
import { getInventoryStatus } from '../../utils/analyticsUtils';
import { useAlerts } from '../../context/AlertContext';
import type { InventoryItem } from '../../types';
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react';

const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'All-Purpose Flour', unit: 'kg', current_stock: 8.5, min_threshold: 5, max_capacity: 50, unit_cost: 45, supplier: 'GrainMaster', updated_at: new Date().toISOString() },
  { id: '2', name: 'Granulated Sugar', unit: 'kg', current_stock: 3.2, min_threshold: 5, max_capacity: 40, unit_cost: 55, supplier: 'SweetSupply', updated_at: new Date().toISOString() },
  { id: '3', name: 'Unsalted Butter', unit: 'kg', current_stock: 1.5, min_threshold: 3, max_capacity: 20, unit_cost: 480, supplier: 'DairyFarm', updated_at: new Date().toISOString() },
  { id: '4', name: 'Fresh Eggs', unit: 'dozen', current_stock: 8, min_threshold: 5, max_capacity: 30, unit_cost: 90, supplier: 'ChickenFarm', updated_at: new Date().toISOString() },
  { id: '5', name: 'Fresh Milk', unit: 'litre', current_stock: 12, min_threshold: 8, max_capacity: 40, unit_cost: 60, supplier: 'DairyFarm', updated_at: new Date().toISOString() },
  { id: '6', name: 'Cocoa Powder', unit: 'kg', current_stock: 0.8, min_threshold: 2, max_capacity: 10, unit_cost: 850, supplier: 'ChocoCo', updated_at: new Date().toISOString() },
  { id: '7', name: 'Vanilla Extract', unit: 'ml', current_stock: 350, min_threshold: 200, max_capacity: 1000, unit_cost: 2, supplier: 'FlavorWorld', updated_at: new Date().toISOString() },
  { id: '8', name: 'Baking Powder', unit: 'kg', current_stock: 1.2, min_threshold: 1, max_capacity: 5, unit_cost: 200, supplier: 'ChemSupply', updated_at: new Date().toISOString() },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [loading, setLoading] = useState(false);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState<Record<string, number>>({});
  const { addAlert } = useAlerts();

  useEffect(() => {
    getInventory().then(data => { if (data?.length) setItems(data); }).catch(() => {});
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
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, current_stock: Math.min(i.current_stock + amount, i.max_capacity) } : i));
    } catch {}
    setRestockingId(null);
  };

  const lowStockItems = items.filter(i => i.current_stock <= i.min_threshold);

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-page-title">📦 Inventory Management</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary btn-sm"><Plus size={16} /> Add Ingredient</button>
          <button onClick={() => getInventory().then(d => d?.length && setItems(d)).catch(() => {})} className="btn btn-sm" style={{ background: 'var(--cream)', color: 'var(--text-muted)' }}><RefreshCw size={16} /> Refresh</button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertTriangle size={24} color="#EF4444" />
          <div>
            <div style={{ fontWeight: 700, color: '#DC2626', marginBottom: '0.25rem' }}>{lowStockItems.length} ingredient(s) below minimum threshold!</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{lowStockItems.map(i => i.name).join(', ')}</div>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Current Stock</th>
              <th>Min Threshold</th>
              <th>Stock Level</th>
              <th>Status</th>
              <th>Unit Cost</th>
              <th>Restock</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const { label, color, pct } = getInventoryStatus(item.current_stock, item.min_threshold, item.max_capacity);
              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.supplier}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{item.current_stock} {item.unit}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.min_threshold} {item.unit}</td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="stock-bar" style={{ flex: 1 }}>
                        <div className="stock-fill" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color, minWidth: 35 }}>{Math.round(pct)}%</span>
                    </div>
                  </td>
                  <td><span className="badge" style={{ background: `${color}20`, color }}>{label}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>₹{item.unit_cost}/{item.unit}</td>
                  <td>
                    {restockingId === item.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="number" min={1} value={restockAmount[item.id] || 10} onChange={e => setRestockAmount(prev => ({ ...prev, [item.id]: Number(e.target.value) }))} className="input-field" style={{ width: 70, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                        <button onClick={() => handleRestock(item)} className="btn btn-primary btn-sm">Add</button>
                        <button onClick={() => setRestockingId(null)} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setRestockingId(item.id)} className="btn btn-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#16A34A' }}>+ Restock</button>
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
