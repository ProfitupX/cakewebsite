import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, BarChart3, Clock, Bell, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/inventory', icon: Package, label: 'Inventory' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/happy-hours', icon: Clock, label: 'Happy Hours' },
  { to: '/admin/alerts', icon: Bell, label: 'Alerts' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { unreadCount } = useAlerts();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>🎂 Sowmis Cake</span>
          <button onClick={() => setMobileOpen(false)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', display: 'none' }} className="sidebar-close">
            <X size={20} />
          </button>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>Smart Kitchen & Admin</div>
      </div>

      <nav className="sidebar-nav">
        <div style={{ padding: '0 1.75rem', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>Main Menu</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={`sidebar-link ${location.pathname === to ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
            {label === 'Alerts' && unreadCount > 0 && (
              <span className="badge badge-rose" style={{ marginLeft: 'auto', minWidth: 20, height: 20, borderRadius: '50%', justifyContent: 'center', fontSize: '0.7rem' }}>
                {unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>
            {profile?.full_name?.charAt(0) || 'A'}
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>{profile?.full_name || 'Admin'}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Administrator</div>
          </div>
        </div>
        <button onClick={signOut} className="sidebar-link" style={{ width: '100%', background: 'none', cursor: 'pointer', borderRadius: '8px' }}>
          <LogOut size={18} /><span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="admin-sidebar">
        <SidebarContent />
      </aside>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 200, background: 'var(--chocolate)', color: 'white', width: 44, height: 44, borderRadius: '10px', display: 'none', alignItems: 'center', justifyContent: 'center' }}
        className="admin-hamburger"
      >
        <Menu size={22} />
      </button>
    </>
  );
}
