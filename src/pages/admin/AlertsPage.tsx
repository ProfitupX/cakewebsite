import React from 'react';
import { useAlerts } from '../../context/AlertContext';
import { Bell, CheckCircle, AlertTriangle, Package } from 'lucide-react';

export default function AlertsPage() {
  const { alerts, unreadCount, markRead, markAllRead, clearAlerts } = useAlerts();

  return (
    <div>
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 className="admin-page-title">🔔 Stock Alerts</h1>
          {unreadCount > 0 && <span className="badge badge-rose">{unreadCount} new</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={markAllRead} className="btn btn-sm" style={{ background: 'var(--cream)', color: 'var(--text-muted)' }}>Mark All Read</button>
          <button onClick={clearAlerts} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>Clear All</button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', background: 'white', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)' }}>
          <CheckCircle size={64} color="#22C55E" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--chocolate)', marginBottom: '0.75rem' }}>All Clear!</h3>
          <p style={{ color: 'var(--text-muted)' }}>All inventory levels are within healthy thresholds.</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Alerts will appear here automatically when stock drops below minimum thresholds.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                borderLeft: `4px solid ${alert.type === 'out_of_stock' ? '#EF4444' : alert.is_read ? 'var(--border)' : 'var(--rose)'}`,
                opacity: alert.is_read ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: alert.type === 'out_of_stock' ? 'rgba(239,68,68,0.1)' : 'rgba(232,25,75,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {alert.type === 'out_of_stock' ? <AlertTriangle size={24} color="#EF4444" /> : <Package size={24} color="var(--rose)" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.95rem' }}>{alert.message}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {new Date(alert.created_at).toLocaleString('en-IN')} · {alert.ingredient.name} · {alert.ingredient.current_stock} {alert.ingredient.unit} remaining
                </div>
              </div>
              {!alert.is_read && (
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--rose)', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Demo: Trigger a test alert */}
      <div style={{ marginTop: '2rem', background: 'white', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Demo Controls</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Alerts are triggered automatically when inventory drops below threshold during order placement. Visit the Inventory page to restock items.</p>
        <a href="/admin/inventory" className="btn btn-primary btn-sm">Go to Inventory →</a>
      </div>
    </div>
  );
}
