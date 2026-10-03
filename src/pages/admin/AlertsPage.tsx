import React, { useState } from 'react';
import { useAlerts } from '../../context/AlertContext';
import { Bell, CheckCircle, AlertTriangle, Package, RefreshCw, Plus, Sparkles } from 'lucide-react';

export default function AlertsPage() {
  const { alerts, unreadCount, lowStockItems, markRead, markAllRead, clearAlerts, quickRestock, refreshAlerts } = useAlerts();
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [restockingAll, setRestockingAll] = useState(false);

  const handleRestock = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRestockingId(id);
    await quickRestock(id, 10);
    setRestockingId(null);
  };

  const handleRestockAll = async () => {
    setRestockingAll(true);
    try {
      for (const item of lowStockItems) {
        await quickRestock(item.id, 15);
      }
      await refreshAlerts();
    } finally {
      setRestockingAll(false);
    }
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="admin-page-title">🔔 Kitchen Stock Alerts</h1>
            {unreadCount > 0 && <span className="badge badge-rose">{unreadCount} active</span>}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Automated alerts when ordered cakes reduce raw materials below safety thresholds
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {lowStockItems.length > 0 && (
            <button
              onClick={handleRestockAll}
              disabled={restockingAll}
              className="btn btn-sm"
              style={{ background: '#16A34A', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} className={restockingAll ? 'spin' : ''} />
              {restockingAll ? 'Restocking All...' : `⚡ Restock All (${lowStockItems.length} items)`}
            </button>
          )}
          <button onClick={markAllRead} className="btn btn-sm" style={{ background: 'var(--cream)', color: 'var(--text-muted)' }}>
            Mark All Read
          </button>
          <button onClick={clearAlerts} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
            Clear All
          </button>
        </div>
      </div>

      {/* Critical Stock Summary Card */}
      {lowStockItems.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
        }}>
          <h4 style={{ color: '#B91C1C', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} /> Currently Below Minimum Safety Threshold
          </h4>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {lowStockItems.map(item => (
              <span
                key={item.id}
                style={{
                  background: 'white',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <strong>{item.name}:</strong>
                <span style={{ color: '#DC2626', fontWeight: 800 }}>{item.current_stock} {item.unit}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>(Min: {item.min_threshold})</span>
                <button
                  onClick={(e) => handleRestock(item.id, e)}
                  disabled={restockingId === item.id}
                  style={{
                    background: '#16A34A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.15rem 0.45rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  +10
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', background: 'white', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)' }}>
          <CheckCircle size={64} color="#22C55E" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--chocolate)', marginBottom: '0.75rem' }}>All Kitchen Stock Levels Healthy!</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 450, margin: '0 auto' }}>
            When customers place cake orders, ingredients are calculated automatically and deducted. If stock drops below threshold, alerts will pop up immediately.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {alerts.map(alert => (
            <div
              key={alert.id}
              onClick={() => markRead(alert.id)}
              style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 1.5rem',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderLeft: `5px solid ${alert.type === 'out_of_stock' ? '#EF4444' : alert.is_read ? 'var(--border)' : '#F59E0B'}`,
                opacity: alert.is_read ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: alert.type === 'out_of_stock' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {alert.type === 'out_of_stock' ? <AlertTriangle size={24} color="#EF4444" /> : <Package size={24} color="#F59E0B" />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--chocolate)' }}>
                      {alert.ingredient.name}
                    </span>
                    <span className={`badge ${alert.type === 'out_of_stock' ? 'badge-rose' : 'badge-gold'}`} style={{ fontSize: '0.7rem' }}>
                      {alert.type === 'out_of_stock' ? '0 STOCK' : 'LOW STOCK'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#4B5563', marginBottom: '0.25rem' }}>{alert.message}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {new Date(alert.created_at).toLocaleString('en-IN')} · Current: {alert.ingredient.current_stock} {alert.ingredient.unit} · Min Safety Threshold: {alert.ingredient.min_threshold} {alert.ingredient.unit}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <button
                  onClick={(e) => handleRestock(alert.ingredient.id, e)}
                  disabled={restockingId === alert.ingredient.id}
                  className="btn btn-sm"
                  style={{ background: '#16A34A', color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}
                >
                  <Plus size={13} />
                  {restockingId === alert.ingredient.id ? 'Restocking...' : '+10 Restock'}
                </button>
                {!alert.is_read && (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--rose)' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
