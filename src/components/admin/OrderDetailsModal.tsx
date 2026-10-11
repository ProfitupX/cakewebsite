import React, { useState, useEffect } from 'react';
import { 
  X, Clock, Flame, Scale, ChefHat, CheckCircle2, AlertTriangle, 
  MapPin, Phone, User, Calendar, Sparkles, Printer, FileText, Check, ArrowRight
} from 'lucide-react';
import type { Order, OrderStatus, OrderItem, AICakeCalculation } from '../../types';
import { calculateCakeRequirementsWithAI } from '../../lib/gemini';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => Promise<void> | void;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  confirmed: { label: 'Confirmed', color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  baking: { label: 'Baking in Oven 🔥', color: '#DB2777', bg: 'rgba(219,39,119,0.1)' },
  ready: { label: 'Ready for Pickup / Delivery 🎂', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  delivered: { label: 'Delivered', color: '#4B5563', bg: 'rgba(75,85,99,0.1)' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
};

export default function OrderDetailsModal({ order, onClose, onStatusChange }: OrderDetailsModalProps) {
  const [calculations, setCalculations] = useState<Record<string, AICakeCalculation>>({});
  const [loadingAI, setLoadingAI] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    if (!order) return;
    let isMounted = true;
    setLoadingAI(true);

    const items = order.items || [];
    
    // Calculate AI recipe & baking time for each item in the order
    const promises = items.map(async (item, idx) => {
      let cakeName = item.product?.name || (item.is_custom ? 'Custom 3D Cake' : 'Artisan Cake');
      let weightKg = item.product?.weight_kg || 1;
      let flavor = 'Vanilla';
      let tiers = 1;
      let frosting = 'Buttercream';
      let topping = 'None';
      let notes = '';

      if (item.customization) {
        flavor = item.customization.flavor || flavor;
        tiers = item.customization.tiers || tiers;
        frosting = item.customization.frosting || frosting;
        topping = item.customization.topping || topping;
        notes = item.customization.message || '';
        const sizeMap: Record<string, number> = {
          'Small (0.5kg)': 0.5,
          'Medium (1kg)': 1,
          'Large (2kg)': 2,
          'XLarge (3kg)': 3,
        };
        weightKg = sizeMap[item.customization.size] || 1;
        cakeName = `${flavor} Cake (${item.customization.size})`;
      } else if (item.product) {
        flavor = item.product.name.includes('Chocolate') ? 'Chocolate' : (item.product.name.includes('Velvet') ? 'RedVelvet' : (item.product.name.includes('Mango') ? 'Mango' : (item.product.name.includes('Lemon') ? 'Lemon' : 'Vanilla')));
      }

      const calc = await calculateCakeRequirementsWithAI({
        cake_name: cakeName,
        weight_kg: weightKg * item.quantity,
        tiers,
        flavor,
        frosting,
        topping,
        notes,
      });

      return { key: item.id || `item-${idx}`, calc };
    });

    Promise.all(promises).then(results => {
      if (isMounted) {
        const map: Record<string, AICakeCalculation> = {};
        results.forEach(r => { map[r.key] = r.calc; });
        setCalculations(map);
        setLoadingAI(false);
      }
    }).catch(() => {
      if (isMounted) setLoadingAI(false);
    });

    return () => { isMounted = false; };
  }, [order]);

  if (!order) return null;

  // Extract customer info from profile or notes
  const customerName = order.profile?.full_name || (() => {
    const match = order.notes?.match(/Customer:\s*([^|]+)/);
    return match ? match[1].trim() : (order.user_id ? 'Customer' : 'Guest Customer');
  })();

  const customerPhone = (() => {
    const match = order.notes?.match(/Phone:\s*([^|]+)/);
    return match ? match[1].trim() : '';
  })();

  const customerCleanNotes = (() => {
    if (!order.notes) return '';
    const noteMatch = order.notes.match(/Note:\s*([^|]+)/);
    if (noteMatch) return noteMatch[1].trim();
    // Return notes without the Customer / Phone prefix if possible
    return order.notes.replace(/Customer:[^|]+\|?/g, '').replace(/Phone:[^|]+\|?/g, '').trim();
  })();

  const handleStatus = async (status: OrderStatus) => {
    if (!onStatusChange) return;
    setUpdating(true);
    await onStatusChange(order.id, status);
    setUpdating(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // Compute overall estimated baking & kitchen prep duration
  const allCalcs = Object.values(calculations);
  const maxBakeTime = allCalcs.reduce((max, c) => Math.max(max, c.baking_specs.bake_time_mins), 35);
  const totalPrepTime = allCalcs.reduce((sum, c) => sum + c.baking_specs.prep_time_mins, 20);
  const totalKitchenMins = maxBakeTime + totalPrepTime + 40; // cooling & assembly

  const orderPlacedDate = new Date(order.created_at);
  const estimatedReadyTime = new Date(orderPlacedDate.getTime() + totalKitchenMins * 60000);

  return (
    <div className="alert-overlay" onClick={onClose} style={{ zIndex: 1000, overflowY: 'auto', padding: '1.5rem 1rem' }}>
      <div 
        className="alert-modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '850px', 
          width: '100%', 
          maxHeight: '92vh', 
          overflowY: 'auto', 
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          background: '#FFFFFF',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: 0, color: 'var(--chocolate)' }}>
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h2>
              <span 
                className="badge" 
                style={{ 
                  background: STATUS_CONFIG[order.status]?.bg || 'rgba(0,0,0,0.05)', 
                  color: STATUS_CONFIG[order.status]?.color || '#000',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  padding: '0.3rem 0.75rem',
                }}
              >
                ● {STATUS_CONFIG[order.status]?.label || order.status}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Placed on {new Date(order.created_at).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button 
              onClick={handlePrint}
              className="btn btn-sm"
              style={{ background: 'var(--cream)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              title="Print Kitchen Baking Slip"
            >
              <Printer size={15} /> Print Slip
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* ── TOP HIGHLIGHT: LIVE BAKING TIME & OVEN SPECS ────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF5F7 0%, #FFF9F5 100%)',
          borderRadius: '16px',
          border: '1.5px solid rgba(232,25,75,0.2)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          boxShadow: '0 8px 24px rgba(232,25,75,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <ChefHat size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--chocolate)' }}>
                Automated Kitchen Baking Time & Specs
              </h3>
            </div>
            <span className="badge badge-rose" style={{ fontSize: '0.74rem' }}>
              ⚡ AI Auto-Calculated for Kitchen
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'white', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.74rem', color: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                <Flame size={14} /> Oven Temperature
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--chocolate)' }}>
                {allCalcs[0]?.baking_specs.temp_celsius || 175}°C
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Convection Preheated</div>
            </div>

            <div style={{ background: 'white', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.74rem', color: '#0284C7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                <Clock size={14} /> Active Bake Time
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284C7' }}>
                {maxBakeTime} mins
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Middle Rack Position</div>
            </div>

            <div style={{ background: 'white', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                <Scale size={14} /> Prep & Batter Time
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16A34A' }}>
                {totalPrepTime} mins
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dry & Wet Ingredient Mix</div>
            </div>

            <div style={{ background: 'white', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.74rem', color: '#9333EA', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                <CheckCircle2 size={14} /> Est. Ready By
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--chocolate)' }}>
                {estimatedReadyTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>~{totalKitchenMins} mins total cycle</div>
            </div>
          </div>
        </div>

        {/* ── CUSTOMER & DELIVERY CARD ─────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          background: 'var(--cream)',
          borderRadius: '14px',
          padding: '1.25rem',
          marginBottom: '1.75rem',
        }}>
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
              Customer Information
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.98rem', color: 'var(--chocolate)', marginBottom: '0.3rem' }}>
              <User size={16} color="var(--rose)" /> {customerName}
            </div>
            {customerPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: '#1F2937', marginBottom: '0.3rem' }}>
                <Phone size={15} color="#16A34A" /> 
                <a href={`tel:${customerPhone}`} style={{ color: '#16A34A', fontWeight: 600 }}>{customerPhone}</a>
              </div>
            )}
            {order.profile?.email && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '1.5rem' }}>
                {order.profile.email}
              </div>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
              Delivery Details
            </h4>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--chocolate)', marginBottom: '0.3rem', lineHeight: 1.4 }}>
              <MapPin size={16} color="var(--rose)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{order.delivery_address || 'Takeaway / Pickup at Bakery'}</span>
            </div>
            {order.delivery_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                <Calendar size={14} /> Target Delivery: <strong>{new Date(order.delivery_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </div>
            )}
            {customerCleanNotes && (
              <div style={{ background: 'white', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: '#4B5563', marginTop: '0.5rem', border: '1px solid var(--border)' }}>
                <strong>Note:</strong> {customerCleanNotes}
              </div>
            )}
          </div>
        </div>

        {/* ── ORDERED ITEMS & AI INGREDIENT BREAKDOWNS ─────────────────── */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--chocolate)' }}>
            Ordered Cake Items ({order.items?.length || 0})
          </h3>

          {(!order.items || order.items.length === 0) ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--cream)', borderRadius: '12px', color: 'var(--text-muted)' }}>
              No detailed items found for this order.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {order.items.map((item, idx) => {
                const key = item.id || `item-${idx}`;
                const calc = calculations[key];
                const itemName = item.is_custom 
                  ? `🎨 Custom 3D Cake: ${item.customization?.flavor || 'Custom'} (${item.customization?.size || '1kg'})`
                  : (item.product?.name || 'Artisan Bakery Cake');

                return (
                  <div 
                    key={key} 
                    style={{ 
                      border: '1px solid var(--border)', 
                      borderRadius: '16px', 
                      padding: '1.5rem',
                      background: '#FFFFFF',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    }}
                  >
                    {/* Item Heading & Price */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                          🎂
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--chocolate)' }}>{itemName}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Quantity: <strong>{item.quantity}</strong> | Unit Price: ₹{item.unit_price}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--rose)' }}>
                          ₹{(item.unit_price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Custom Specifications */}
                    {item.customization && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        <span className="badge" style={{ background: '#FFF1F2', color: '#BE123C' }}>🍰 Flavor: {item.customization.flavor}</span>
                        <span className="badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>⚖️ Size: {item.customization.size}</span>
                        <span className="badge" style={{ background: '#F0FDF4', color: '#15803D' }}>🎂 Tiers: {item.customization.tiers}</span>
                        <span className="badge" style={{ background: '#FAF5FF', color: '#7E22CE' }}>🧁 Frosting: {item.customization.frosting}</span>
                        <span className="badge" style={{ background: '#FFFBEB', color: '#B45309' }}>🍓 Topping: {item.customization.topping}</span>
                        {item.customization.message && (
                          <span className="badge" style={{ background: '#F3F4F6', color: '#374151', width: '100%', justifyContent: 'flex-start' }}>
                            ✍️ Cake Message: "{item.customization.message}"
                          </span>
                        )}
                      </div>
                    )}

                    {/* AI Automated Ingredients Deduction Breakdown */}
                    {calc && (
                      <div style={{ background: 'var(--cream)', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 800, color: 'var(--chocolate)' }}>
                            <Sparkles size={16} color="var(--rose)" />
                            <span>AI Calculated Ingredients (Auto-Deducted from Kitchen Stock)</span>
                          </div>
                          <span style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={13} /> Synchronized with DB
                          </span>
                        </div>

                        {/* Ingredients Pills */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                          {calc.ingredients.map((ing, iIdx) => (
                            <div 
                              key={iIdx}
                              style={{ 
                                background: 'white', 
                                padding: '0.5rem 0.75rem', 
                                borderRadius: '8px', 
                                border: '1px solid rgba(0,0,0,0.06)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.78rem'
                              }}
                            >
                              <span style={{ fontWeight: 600, color: '#374151' }}>{ing.name}</span>
                              <strong style={{ color: 'var(--rose)' }}>{ing.amount} {ing.unit}</strong>
                            </div>
                          ))}
                        </div>

                        {/* Baker Tips */}
                        {calc.baker_tips.length > 0 && (
                          <div style={{ borderLeft: '3px solid var(--rose)', paddingLeft: '0.75rem', fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.45 }}>
                            <strong>Chef's Note:</strong> {calc.baker_tips[0]}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── STATUS UPDATER BAR ────────────────────────────────────── */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Update Order Stage:</div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {(['pending', 'confirmed', 'baking', 'ready', 'delivered'] as OrderStatus[]).map(st => (
                <button
                  key={st}
                  disabled={updating || order.status === st}
                  onClick={() => handleStatus(st)}
                  className="btn btn-sm"
                  style={{
                    borderRadius: '50px',
                    fontSize: '0.78rem',
                    padding: '0.35rem 0.85rem',
                    background: order.status === st ? 'var(--chocolate)' : 'white',
                    color: order.status === st ? 'white' : 'var(--text-main)',
                    border: '1px solid var(--border)',
                    fontWeight: order.status === st ? 700 : 500,
                  }}
                >
                  {st === 'baking' ? '🔥 Baking' : (st === 'ready' ? '🎂 Ready' : (st.charAt(0).toUpperCase() + st.slice(1)))}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Amount</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--chocolate)' }}>
                ₹{order.total_amount?.toLocaleString()}
              </div>
            </div>
            <button onClick={onClose} className="btn btn-primary btn-sm" style={{ padding: '0.6rem 1.4rem' }}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
