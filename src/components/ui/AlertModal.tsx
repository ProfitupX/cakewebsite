import React from 'react';
import { X, Bell, Package, CheckCircle } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';

export default function AlertModal() {
  const { alerts, unreadCount, markRead, markAllRead } = useAlerts();
  const [open, setOpen] = React.useState(false);

  const recent = alerts.slice(0, 5);
  const latestUnread = alerts.find(a => !a.is_read);
  const [showPopup, setShowPopup] = React.useState(false);

  React.useEffect(() => {
    if (unreadCount > 0) {
      setShowPopup(true);
      const t = setTimeout(() => setShowPopup(false), 5000);
      return () => clearTimeout(t);
    }
  }, [unreadCount]);

  return (
    <>
      {/* Floating alert popup */}
      {showPopup && latestUnread && (
        <div className="floating-notification" onClick={() => { setShowPopup(false); setOpen(true); }}>
          <div style={{ width: 40, height: 40, background: 'rgba(232,25,75,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={20} color="var(--rose)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>Inventory Alert</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {latestUnread.message}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setShowPopup(false); }} style={{ background: 'none', color: 'var(--text-muted)', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Alert drawer button - shown only in admin */}
      {open && (
        <div className="alert-overlay" onClick={() => setOpen(false)}>
          <div className="alert-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Bell size={22} color="var(--rose)" />
                <h3 style={{ fontFamily: 'Playfair Display, serif' }}>Stock Alerts</h3>
                {unreadCount > 0 && <span className="badge badge-rose">{unreadCount} new</span>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={markAllRead} className="btn btn-sm" style={{ background: 'var(--cream)', color: 'var(--text-muted)' }}>Mark all read</button>
                <button onClick={() => setOpen(false)} style={{ background: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {recent.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <CheckCircle size={48} style={{ margin: '0 auto 1rem', color: '#22C55E' }} />
                  <p>All stock levels are healthy!</p>
                </div>
              )}
              {recent.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => markRead(alert.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: alert.is_read ? 'var(--cream)' : 'rgba(232,25,75,0.06)',
                    border: `1px solid ${alert.is_read ? 'var(--border)' : 'rgba(232,25,75,0.2)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.5rem' }}>
                    <p style={{ fontSize: '0.87rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{alert.message}</p>
                    {!alert.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rose)', flexShrink: 0, marginTop: 5 }} />}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    {new Date(alert.created_at).toLocaleString()}
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
      <button onClick={() => setOpen(true)} style={{ position: 'relative', background: unreadCount > 0 ? 'rgba(232,25,75,0.1)' : 'var(--cream)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
        <Bell size={20} color={unreadCount > 0 ? 'var(--rose)' : 'var(--text-muted)'} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--rose)', color: 'white', width: 18, height: 18, borderRadius: '50%', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount}
          </span>
        )}
      </button>
      {open && <AlertModal />}
    </>
  );
}
