import React from 'react';
import { X, Bell, Package, CheckCircle, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';

export default function AlertModal() {
  const { alerts, unreadCount, markRead, markAllRead, quickRestock } = useAlerts();
  const [open, setOpen] = React.useState(false);
  const [restockingId, setRestockingId] = React.useState<string | null>(null);

  const recent = alerts.slice(0, 10);
  const latestUnread = alerts.find(a => !a.is_read);
  const [showPopup, setShowPopup] = React.useState(false);

  React.useEffect(() => {
    if (unreadCount > 0) {
      setShowPopup(true);
      const t = setTimeout(() => setShowPopup(false), 8000);
      return () => clearTimeout(t);
    }
  }, [unreadCount]);

  const handleQuickRestock = async (ingredientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRestockingId(ingredientId);
    await quickRestock(ingredientId, 10);
    setRestockingId(null);
  };

  return (
    <>
      {/* Floating alert popup */}
      {showPopup && latestUnread && (
        <div
          className="floating-notification"
          onClick={() => { setShowPopup(false); setOpen(true); }}
          style={{
            cursor: 'pointer',
            borderLeft: '5px solid #EF4444',
            boxShadow: '0 12px 36px rgba(239, 68, 68, 0.25)',
            background: '#FFF8F8',
            maxWidth: '440px',
          }}
        >
          <div style={{ width: 44, height: 44, background: 'rgba(239,68,68,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'pulse 1.5s infinite' }}>
            <AlertTriangle size={22} color="#EF4444" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Low Stock Notification</span>
              <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>Admin Alert</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#4B5563', marginTop: '0.2rem', lineHeight: 1.35 }}>
              {latestUnread.message}
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={(e) => handleQuickRestock(latestUnread.ingredient.id, e)}
                disabled={restockingId === latestUnread.ingredient.id}
                className="btn btn-sm"
                style={{
                  background: '#16A34A',
                  color: 'white',
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <RefreshCw size={12} className={restockingId === latestUnread.ingredient.id ? 'spin' : ''} />
                {restockingId === latestUnread.ingredient.id ? 'Restocking...' : '+10 Restock'}
              </button>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowPopup(false); }}
            style={{ background: 'none', border: 'none', color: '#9CA3AF', flexShrink: 0, cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Alert drawer / Modal */}
      {open && (
        <div className="alert-overlay" onClick={() => setOpen(false)}>
          <div className="alert-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(232,25,75,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={20} color="var(--rose)" />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', margin: 0 }}>Kitchen Stock Alerts</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Automated inventory tracking & replenishment</p>
                </div>
                {unreadCount > 0 && <span className="badge badge-rose">{unreadCount} active</span>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button onClick={markAllRead} className="btn btn-sm" style={{ background: 'var(--cream)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>Mark all read</button>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '420px', overflowY: 'auto' }}>
              {recent.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <CheckCircle size={48} style={{ margin: '0 auto 1rem', color: '#22C55E' }} />
                  <h4 style={{ color: '#16A34A', marginBottom: '0.35rem' }}>All Stock Levels Healthy</h4>
                  <p style={{ fontSize: '0.85rem' }}>Ingredients are properly stocked above safety thresholds.</p>
                </div>
              )}
              {recent.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => markRead(alert.id)}
                  style={{
                    padding: '1.1rem',
                    borderRadius: '12px',
                    background: alert.is_read ? 'white' : 'rgba(239,68,68,0.05)',
                    border: `1px solid ${alert.is_read ? 'var(--border)' : 'rgba(239,68,68,0.3)'}`,
                    boxShadow: alert.is_read ? 'none' : '0 4px 14px rgba(239,68,68,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--chocolate)' }}>
                          {alert.ingredient.name}
                        </span>
                        <span className={`badge ${alert.type === 'out_of_stock' ? 'badge-rose' : 'badge-gold'}`} style={{ fontSize: '0.7rem' }}>
                          {alert.type === 'out_of_stock' ? 'OUT OF STOCK' : 'LOW STOCK'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#4B5563', lineHeight: 1.4, margin: '0.2rem 0' }}>
                        {alert.message}
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        Current: <strong style={{ color: '#DC2626' }}>{alert.ingredient.current_stock} {alert.ingredient.unit}</strong> | Min Threshold: {alert.ingredient.min_threshold} {alert.ingredient.unit} | Max: {alert.ingredient.max_capacity} {alert.ingredient.unit}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleQuickRestock(alert.ingredient.id, e)}
                      disabled={restockingId === alert.ingredient.id}
                      className="btn btn-sm"
                      style={{
                        background: '#16A34A',
                        color: 'white',
                        fontSize: '0.78rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        flexShrink: 0,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <RefreshCw size={13} className={restockingId === alert.ingredient.id ? 'spin' : ''} />
                      {restockingId === alert.ingredient.id ? 'Adding...' : '+10 Restock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AlertBell() {
  const { unreadCount } = useAlerts();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Stock Alerts"
        style={{
          position: 'relative',
          background: unreadCount > 0 ? 'rgba(232,25,75,0.12)' : 'var(--cream)',
          border: unreadCount > 0 ? '1px solid rgba(232,25,75,0.3)' : 'none',
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <Bell size={20} color={unreadCount > 0 ? 'var(--rose)' : 'var(--text-muted)'} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#EF4444',
              color: 'white',
              width: 20,
              height: 20,
              borderRadius: '50%',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
      {open && <AlertModal />}
    </>
  );
}
