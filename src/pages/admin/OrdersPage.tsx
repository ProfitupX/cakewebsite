import React, { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import type { Order, OrderStatus } from '../../types';
import { RefreshCw, Search } from 'lucide-react';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'baking', 'ready', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = () => {
      getOrders().then(setOrders).catch(() => {});
    };
    fetchOrders();

    const sub = supabase.channel('orders_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch {}
    setUpdating(null);
  };

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      const name = o.profile?.full_name?.toLowerCase() || '';
      const email = o.profile?.email?.toLowerCase() || '';
      const addr = o.delivery_address?.toLowerCase() || '';
      const id = o.id.toLowerCase();
      return name.includes(s) || email.includes(s) || addr.includes(s) || id.includes(s);
    });

  const counts: Record<string, number> = {};
  STATUSES.forEach(s => { counts[s] = orders.filter(o => o.status === s).length; });

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-page-title">🛍️ Orders Management</h1>
        <button onClick={() => getOrders().then(setOrders).catch(() => {})} className="btn btn-sm" style={{ background: 'var(--cream)', color: 'var(--text-muted)' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button onClick={() => setFilter('all')} className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : ''}`} style={{ borderRadius: '50px', background: filter === 'all' ? undefined : 'white', color: filter === 'all' ? undefined : 'var(--text-muted)', border: '1px solid var(--border)' }}>All ({orders.length})</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : ''}`} style={{ borderRadius: '50px', background: filter === s ? undefined : 'white', color: filter === s ? undefined : 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {s.charAt(0).toUpperCase() + s.slice(1)} {counts[s] > 0 ? `(${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: '1.5rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input type="text" placeholder="Search by name or order ID..." value={search} onChange={e => setSearch(e.target.value)} className="input-field" style={{ paddingLeft: '3rem' }} />
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th><th>Update Status</th></tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr key={order.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{order.id.slice(0, 8).toUpperCase()}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{order.profile?.full_name || (order.user_id ? 'Customer' : 'Guest Customer')}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {order.profile?.email || (order.delivery_address ? `📍 ${order.delivery_address}` : 'Guest Order')}
                  </div>
                </td>
                <td style={{ fontWeight: 700 }}>₹{order.total_amount?.toLocaleString()}</td>
                <td><span className={`status-chip status-${order.status}`}>● {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    disabled={updating === order.id || order.status === 'delivered' || order.status === 'cancelled'}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.85rem', background: 'white', cursor: 'pointer' }}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📝</div><p>No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
