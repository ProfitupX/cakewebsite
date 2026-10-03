import React, { useState } from 'react';
import CakeVisualizer from './CakeVisualizer';
import AICakeCalculator from './AICakeCalculator';
import { calculateCakePrice } from '../../utils/pricingUtils';
import type { CakeCustomization, CakeFlavor, CakeTier, CakeTopping, CakeFrosting, CakeSize } from '../../types';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, ChevronRight } from 'lucide-react';

const FLAVORS: Array<{ key: CakeFlavor; emoji: string; desc: string }> = [
  { key: 'Chocolate', emoji: '🍫', desc: 'Rich dark cocoa' },
  { key: 'Vanilla', emoji: '🍦', desc: 'Classic creamy' },
  { key: 'RedVelvet', emoji: '❤️', desc: 'Velvety crimson' },
  { key: 'Strawberry', emoji: '🍓', desc: 'Fresh berry burst' },
  { key: 'Lemon', emoji: '🍋', desc: 'Zesty citrus' },
  { key: 'Mango', emoji: '🥭', desc: 'Tropical sweet' },
];

const FROSTINGS: Array<{ key: CakeFrosting; emoji: string }> = [
  { key: 'Buttercream', emoji: '🧈' },
  { key: 'Whipped', emoji: '☁️' },
  { key: 'Fondant', emoji: '🎭' },
  { key: 'Naked', emoji: '🌿' },
];

const TOPPINGS: Array<{ key: CakeTopping; emoji: string }> = [
  { key: 'None', emoji: '➖' },
  { key: 'Berries', emoji: '🍓' },
  { key: 'Sprinkles', emoji: '🎊' },
  { key: 'Flowers', emoji: '🌸' },
  { key: 'Drizzle', emoji: '🍫' },
  { key: 'Macarons', emoji: '🧁' },
];

const SIZES: CakeSize[] = ['Small (0.5kg)', 'Medium (1kg)', 'Large (2kg)', 'XLarge (3kg)'];

const defaultCustomization: CakeCustomization = {
  flavor: 'Chocolate',
  tiers: 1,
  topping: 'None',
  frosting: 'Buttercream',
  size: 'Medium (1kg)',
};

interface CakeCustomizerProps {
  happyHourDiscount?: number;
  onComplete?: () => void;
}

export default function CakeCustomizer({ happyHourDiscount = 0, onComplete }: CakeCustomizerProps) {
  const [customization, setCustomization] = useState<CakeCustomization>(defaultCustomization);
  const [message, setMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [added, setAdded] = useState(false);
  const { addCustomCake } = useCart();

  const update = <K extends keyof CakeCustomization>(key: K, value: CakeCustomization[K]) => {
    setCustomization(prev => ({ ...prev, [key]: value }));
    setAdded(false);
  };

  const price = calculateCakePrice({ ...customization, message });
  const discountedPrice = happyHourDiscount > 0 ? Math.round(price * (1 - happyHourDiscount / 100)) : price;

  const handleAddToCart = () => {
    addCustomCake({ ...customization, message, deliveryDate }, discountedPrice);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    onComplete?.();
  };

  return (
    <div className="cake-builder">
      {/* LEFT: Cake Visualizer */}
      <div className="cake-canvas">
        <div style={{
          background: 'linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '3rem 2rem',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 440,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Animated background circles */}
          {[1,2,3].map(i => (
            <div key={i} style={{
              position: 'absolute',
              width: `${i * 80}px`, height: `${i * 80}px`,
              borderRadius: '50%',
              background: 'rgba(232,25,75,0.04)',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: `floatCake ${3 + i}s ease-in-out infinite`,
            }} />
          ))}
          <CakeVisualizer customization={{ ...customization, message }} />
        </div>

        {/* Price display */}
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.75rem',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Your Cake Price</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span className="price-tag">₹{discountedPrice}</span>
              {happyHourDiscount > 0 && <span className="price-original">₹{price}</span>}
            </div>
          </div>
          {happyHourDiscount > 0 && (
            <span className="badge badge-rose">⚡ {happyHourDiscount}% OFF</span>
          )}
        </div>

        {/* AI Recipe & Kitchen Deduction Calculator */}
        <div style={{ width: '100%', marginTop: '1.25rem' }}>
          <AICakeCalculator customization={{ ...customization, message }} />
        </div>
      </div>

      {/* RIGHT: Options Panel */}
      <div>
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem', boxShadow: 'var(--shadow-card)' }}>

          {/* Flavor */}
          <div className="customizer-section">
            <h4>Choose Flavor</h4>
            <div className="option-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {FLAVORS.map(f => (
                <button
                  key={f.key}
                  className={`option-btn ${customization.flavor === f.key ? 'selected' : ''}`}
                  onClick={() => update('flavor', f.key)}
                >
                  <span className="opt-emoji">{f.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{f.key}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tiers */}
          <div className="customizer-section">
            <h4>Number of Tiers</h4>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {([1, 2, 3] as CakeTier[]).map(t => (
                <button
                  key={t}
                  className={`option-btn ${customization.tiers === t ? 'selected' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => update('tiers', t)}
                >
                  <span className="opt-emoji">{'🎂'.repeat(t)}</span>
                  <span>{t} Tier{t > 1 ? 's' : ''}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="customizer-section">
            <h4>Cake Size</h4>
            <div className="option-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {SIZES.map(s => (
                <button
                  key={s}
                  className={`option-btn ${customization.size === s ? 'selected' : ''}`}
                  onClick={() => update('size', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Frosting */}
          <div className="customizer-section">
            <h4>Frosting Style</h4>
            <div className="option-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {FROSTINGS.map(f => (
                <button
                  key={f.key}
                  className={`option-btn ${customization.frosting === f.key ? 'selected' : ''}`}
                  onClick={() => update('frosting', f.key)}
                >
                  <span className="opt-emoji">{f.emoji}</span>
                  {f.key}
                </button>
              ))}
            </div>
          </div>

          {/* Topping */}
          <div className="customizer-section">
            <h4>Topping</h4>
            <div className="option-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {TOPPINGS.map(t => (
                <button
                  key={t.key}
                  className={`option-btn ${customization.topping === t.key ? 'selected' : ''}`}
                  onClick={() => update('topping', t.key)}
                >
                  <span className="opt-emoji">{t.emoji}</span>
                  {t.key}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="customizer-section">
            <h4>Cake Message (Optional)</h4>
            <input
              type="text"
              className="input-field"
              placeholder='e.g. "Happy Birthday Sarah! 🎉"'
              maxLength={50}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          {/* Delivery Date */}
          <div className="customizer-section">
            <h4>Delivery Date</h4>
            <input
              type="date"
              className="input-field"
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
            />
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className={`btn btn-lg ${added ? 'btn-dark' : 'btn-primary'}`}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {added ? (
              <><span>✓</span> Added to Cart!</>
            ) : (
              <><ShoppingCart size={20} /> Add Custom Cake — ₹{discountedPrice}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
