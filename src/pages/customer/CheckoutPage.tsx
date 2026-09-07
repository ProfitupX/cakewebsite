import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../lib/database';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, CreditCard, MapPin } from 'lucide-react';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [orderId, setOrderId] = useState('');
  const delivery = subtotal >= 1000 ? 0 : 99;
  const total = subtotal + delivery;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const orderItems = items.map(item => ({
        product_id: item.product?.id,
        customization: item.customization,
        quantity: item.quantity,
        unit_price: item.unit_price,
        is_custom: item.is_custom,
      }));
      const order = await createOrder(user?.id || null, orderItems, total, 0, notes, undefined);
      setOrderId(order.id);
      clearCart();
      setOrdered(true);
    } catch (err) {
      console.error(err);
      alert('Failed to place order. Please try again.');
    }
    setPlacing(false);
  };

  if (ordered) {
    return (
      <div className="page-enter" style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '3rem', background: 'white', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ width: 80, height: 80, background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle size={48} color="#22C55E" />
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--chocolate)', marginBottom: '0.75rem' }}>Order Placed!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Your delicious cake is being prepared with love.</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--rose)', fontWeight: 600, marginBottom: '2rem' }}>Order ID: #{orderId.slice(0, 8).toUpperCase()}</p>
          <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '1rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            📧 Confirmation sent to your email
          </div>
          <Link to="/" className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--cream)' }}>
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--chocolate)', marginBottom: '2rem' }}>🛒 Checkout</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
          <form onSubmit={handlePlaceOrder}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem', boxShadow: 'var(--shadow-card)', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={20} color="var(--rose)" /> Delivery Details</h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Full Address *</label>
                <textarea className="input-field" rows={3} placeholder="House no, Street, Area, City, PIN" value={address} onChange={e => setAddress(e.target.value)} required style={{ resize: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Order Notes (Optional)</label>
                <input type="text" className="input-field" placeholder="Allergies, special requests..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem', boxShadow: 'var(--shadow-card)' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CreditCard size={20} color="var(--rose)" /> Payment</h3>
              <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '1.5rem', textAlign: 'center', border: '2px dashed var(--border)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💵</div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Cash on Delivery</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pay when your cake arrives — safe and easy!</p>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>Online payment (UPI, Card) coming soon</p>
            </div>
            <button type="submit" disabled={placing} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}>
              {placing ? 'Placing Order...' : `🎂 Place Order — ₹${total}`}
            </button>
          </form>
          <div style={{ position: 'sticky', top: 100, background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '1.5rem' }}>Your Order</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', flex: 1 }}>{item.is_custom ? '🎨 Custom Cake' : item.product?.name} x{item.quantity}</span>
                  <span style={{ fontWeight: 700 }}>₹{item.unit_price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span>₹{subtotal}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '1rem' }}><span style={{ color: 'var(--text-muted)' }}>Delivery</span><span style={{ color: delivery === 0 ? '#22C55E' : 'inherit' }}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}><span>Total</span><span className="price-tag" style={{ fontSize: '1.3rem' }}>₹{total}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
