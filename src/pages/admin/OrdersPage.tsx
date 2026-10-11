import React, { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import type { Order, OrderStatus } from '../../types';
import { RefreshCw, Search, Eye, Flame, Clock, ChefHat, Sparkles } from 'lucide-react';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'baking', 'ready', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = () => {
    getOrders().then(setOrders).catch(() => {});
  };

  useEffect(() => {
    fetchOrders();

    const sub = supabase.channel('orders_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (e) {
      console.error(e);
    }
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
      const notes = o.notes?.toLowerCase() || '';
      const itemNames = (o.items || []).map(i => i.product?.name || i.customization?.flavor || '').join(' ').toLowerCase();
      return name.includes(s) || email.includes(s) || addr.includes(s) || id.includes(s) || notes.includes(s) || itemNames.includes(s);
    });

  const counts: Record<string, number> = {};
  STATUSES.forEach(s => { counts[s] = orders.filter(o => o.status === s).length; });

  // Calculate approximate baking time for quick table preview
  const getBakingTimeBadge = (order: Order) => {
    const items = order.items || [];
    if (items.length === 0) return { bake: '30-40 min', temp: '175°C' };
    let maxWeight = 1;
    items.forEach(it => {
      let w = it.product?.weight_kg || 1;
      if (it.customization?.size) {
        if (it.customization.size.includes('0.5')) w = 0.5;
        else if (it.customization.size.includes('2')) w = 2;
        else if (it.customization.size.includes('3')) w = 3;
      }
      if (w > maxWeight) maxWeight = w;
    });
    const bakeTime = Math.round(28 + maxWeight * 10);
    return { bake: `${bakeTime} min`, temp: '175°C' };
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-page-title">🛍️ Orders Management & AI Kitchen</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Click any order to view customer details, cake items & automatic AI baking calculations
          </p>
        </div>
        <button onClick={fetchOrders} className="btn btn-sm" style={{ background: 'var(--cream)', color: 'var(--text-muted)' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setFilter('all')} 
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : ''}`} 
          style={{ 
            borderRadius: '50px', 
            background: filter === 'all' ? undefined : 'white', 
            color: filter === 'all' ? undefined : 'var(--text-muted)', 
            border: '1px solid var(--border)' 
          }}
        >
          All ({orders.length})
        </button>
        {STATUSES.map(s => (
          <button 
            key={s} 
            onClick={() => setFilter(s)} 
            className={`btn btn-sm ${filter === s ? 'btn-primary' : ''}`} 
            style={{ 
              borderRadius: '50px', 
              background: filter === s ? undefined : 'white', 
              color: filter === s ? undefined : 'var(--text-muted)', 
              border: '1px solid var(--border)' 
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} {counts[s] > 0 ? `(${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 380, marginBottom: '1.5rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search customer, cake name, phone, address..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="input-field" 
          style={{ paddingLeft: '3rem' }} 
        />
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer & Contact</th>
              <th>Ordered Cakes</th>
              <th>AI Baking Specs</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => {
              const customerName = order.profile?.full_name || (() => {
                const match = order.notes?.match(/Customer:\s*([^|]+)/);
                return match ? match[1].trim() : (order.user_id ? 'Customer' : 'Guest Customer');
              })();

              const customerPhone = (() => {
                const match = order.notes?.match(/Phone:\s*([^|]+)/);
                return match ? match[1].trim() : '';
              })();

              const bakingSpecs = getBakingTimeBadge(order);

              return (
                <tr 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                >
                  <td style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--chocolate)' }}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--chocolate)' }}>{customerName}</div>
                    {customerPhone && (
                      <div style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 600 }}>📞 {customerPhone}</div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.delivery_address || (order.profile?.email ? `✉️ ${order.profile.email}` : 'Pickup / Takeaway')}
                    </div>
                  </td>
                  <td>
                    {(!order.items || order.items.length === 0) ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>1x Cake Order</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {order.items.slice(0, 2).map((item, idx) => (
                          <span key={idx} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                            • {item.is_custom 
                                ? `${item.customization?.flavor || 'Custom'} (${item.customization?.size || '1kg'})` 
                                : (item.product?.name || 'Artisan Cake')} x{item.quantity}
                          </span>
                        ))}
                        {order.items.length > 2 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--rose)', fontWeight: 600 }}>
                            +{order.items.length - 2} more item(s)...
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span className="badge badge-gold" style={{ fontSize: '0.74rem', width: 'fit-content' }}>
                        <Clock size={11} style={{ marginRight: 3 }} /> {bakingSpecs.bake}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 600 }}>
                        <Flame size={11} style={{ display: 'inline', marginRight: 2 }} /> {bakingSpecs.temp} Oven
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--rose)' }}>
                    ₹{order.total_amount?.toLocaleString()}
                  </td>
                  <td>
                    <span className={`status-chip status-${order.status}`}>
                      ● {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn btn-sm btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Eye size={13} /> View Details
                      </button>
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        disabled={updating === order.id}
                        style={{ 
                          padding: '0.35rem 0.5rem', 
                          borderRadius: 6, 
                          border: '1px solid var(--border)', 
                          fontSize: '0.78rem', 
                          background: 'white', 
                          cursor: 'pointer' 
                        }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📝</div>
            <h4>No orders found</h4>
            <p style={{ fontSize: '0.85rem' }}>Try adjusting your search query or filter tabs.</p>
          </div>
        )}
      </div>

      {/* ── ORDER DETAILS & AI BAKING TIME MODAL ───────────────────────── */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
