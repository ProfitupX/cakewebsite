import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="page-enter" style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '6rem', marginBottom: '1.5rem' }}>🛒</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '1rem', color: 'var(--chocolate)' }}>Your Cart is Empty</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Looks like you haven't added any cakes yet!</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/menu" className="btn btn-primary btn-lg">Browse Menu</Link>
            <Link to="/custom-order" className="btn btn-secondary btn-lg">Design Custom Cake</Link>
          </div>
        </div>
      </div>
    );
  }

  const delivery = subtotal >= 1000 ? 0 : 99;
  const total = subtotal + delivery;

  return (
    <div className="page-enter" style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--cream)' }}>
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--chocolate)' }}>
            🛒 Your Cart <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>({items.length} item{items.length !== 1 ? 's' : ''})</span>
          </h1>
          <button onClick={clearCart} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', borderRadius: '50px' }}>
            <Trash2 size={14} /> Clear All
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
          {/* Cart Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AnimatePresence>
              {items.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="cart-item"
                >
                  {item.is_custom ? (
                    <div style={{ width: 80, height: 80, borderRadius: 12, background: 'linear-gradient(135deg, #1A0A00, #7B1A30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                      🎂
                    </div>
                  ) : (
                    <img
                      src={item.product?.image_url || ''}
                      alt={item.product?.name}
                      className="cart-item-img"
                    />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--chocolate)' }}>
                      {item.is_custom ? '🎨 Custom Cake' : item.product?.name}
                    </h4>
                    {item.is_custom && item.customization && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        {item.customization.flavor} · {item.customization.tiers} Tier · {item.customization.size} · {item.customization.frosting}
                        {item.customization.message && ` · "${item.customization.message}"`}
                      </p>
                    )}
                    {item.customization?.deliveryDate && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--rose)', fontWeight: 600 }}>
                        📅 Delivery: {new Date(item.customization.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                      <span className="price-tag" style={{ fontSize: '1.1rem' }}>₹{item.unit_price}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    <div className="qty-controls">
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--rose)' }}>₹{item.unit_price * item.quantity}</div>
                    <button onClick={() => removeItem(item.id)} style={{ background: 'none', color: '#EF4444', padding: '0.25rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div style={{ position: 'sticky', top: 100 }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem', boxShadow: 'var(--shadow-card)' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '1.5rem', color: 'var(--chocolate)' }}>Order Summary</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Delivery</span>
                  <span style={{ color: delivery === 0 ? '#22C55E' : 'inherit' }}>
                    {delivery === 0 ? 'FREE 🎉' : `₹${delivery}`}
                  </span>
                </div>
                {delivery > 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--cream)', padding: '0.5rem 0.75rem', borderRadius: 8 }}>
                    💡 Add ₹{1000 - subtotal} more for free delivery!
                  </p>
                )}
                <div style={{ height: 1, background: 'var(--border)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                  <span>Total</span>
                  <span className="price-tag" style={{ fontSize: '1.4rem' }}>₹{total}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
              >
                Proceed to Checkout <ArrowRight size={20} />
              </button>

              <Link to="/menu" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                <ShoppingBag size={16} /> Continue Shopping
              </Link>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--cream)', borderRadius: 12 }}>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <Package size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>All orders are baked fresh and delivered within 24 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
