import React, { useMemo } from 'react';
import type { CakeCustomization } from '../../types';

interface CakeVisualizerProps {
  customization: CakeCustomization;
}

// Color mappings for flavors
const FLAVOR_COLORS: Record<string, { body: string; top: string; frosting: string }> = {
  Chocolate: { body: '#3D1A00', top: '#5C2800', frosting: '#7B3F00' },
  Vanilla:   { body: '#F5DEB3', top: '#FAEBD7', frosting: '#FFFAF0' },
  RedVelvet: { body: '#8B0000', top: '#A00000', frosting: '#CC0000' },
  Strawberry:{ body: '#FF69B4', top: '#FF85C2', frosting: '#FFB6C1' },
  Lemon:     { body: '#FFD700', top: '#FFE44D', frosting: '#FFFACD' },
  Mango:     { body: '#FF8C00', top: '#FFA500', frosting: '#FFD580' },
};

const FROSTING_COLORS: Record<string, string> = {
  Buttercream: '#FFFDE7',
  Whipped:     '#FFFFFF',
  Fondant:     '#F0F0F0',
  Naked:       'transparent',
};

const TOPPING_EMOJIS: Record<string, string[]> = {
  None:      [],
  Berries:   ['🍓', '🫐', '🍒'],
  Sprinkles: ['🌈', '✨', '🎊'],
  Flowers:   ['🌸', '🌺', '🌻'],
  Drizzle:   ['🍫', '🍯'],
  Macarons:  ['🧁', '🍬', '🎀'],
};

const SIZE_WIDTHS: Record<string, number> = {
  'Small (0.5kg)':  160,
  'Medium (1kg)':   200,
  'Large (2kg)':    240,
  'XLarge (3kg)':   280,
};

export default function CakeVisualizer({ customization }: CakeVisualizerProps) {
  const { flavor, tiers, frosting, topping, size } = customization;
  const colors = FLAVOR_COLORS[flavor] || FLAVOR_COLORS.Vanilla;
  const frostingColor = FROSTING_COLORS[frosting] || '#FFFDE7';
  const toppingEmojis = TOPPING_EMOJIS[topping] || [];
  const baseWidth = SIZE_WIDTHS[size] || 200;

  // Build tiers from bottom to top
  const tierData = useMemo(() => {
    const heights = [90, 75, 60];
    const widthMults = [1, 0.78, 0.58];
    return Array.from({ length: tiers }).map((_, i) => ({
      index: i,
      width: Math.round(baseWidth * widthMults[i]),
      height: heights[i],
    }));
  }, [tiers, baseWidth]);

  const isDrizzle = topping === 'Drizzle';
  const dripColor = flavor === 'Chocolate' ? '#1A0A00' : flavor === 'Strawberry' ? '#E8194B' : '#D4A017';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, position: 'relative', userSelect: 'none' }}>

      {/* Floating sparkles */}
      {['✨', '⭐', '✨'].map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${10 + i * 25}%`,
          left: i % 2 === 0 ? '-10%' : '105%',
          fontSize: '1.2rem',
          animation: `floatCake ${2 + i * 0.5}s ease-in-out infinite`,
          animationDelay: `${i * 0.7}s`,
          opacity: 0.7,
        }}>{s}</div>
      ))}

      {/* Candles on top */}
      {tiers > 0 && (
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.25rem', zIndex: 10 }}>
          {Array.from({ length: Math.min(tiers + 1, 3) }).map((_, i) => (
            <div key={i} className="candle">
              <div className="candle-flame">🕯️</div>
              <div className="candle-body" style={{ background: `hsl(${i * 60}, 80%, 70%)`, height: 20 }} />
            </div>
          ))}
        </div>
      )}

      {/* Cake tiers - render top tier first (index 0 = top visually) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        {[...tierData].reverse().map((tier, visualIdx) => {
          const isTop = visualIdx === 0;
          const actualIdx = tiers - 1 - visualIdx; // 0=bottom tier data

          return (
            <div
              key={tier.index}
              style={{
                width: tier.width,
                position: 'relative',
                marginBottom: isTop ? 0 : -4,
                zIndex: tiers - visualIdx,
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Topping on topmost tier */}
              {isTop && toppingEmojis.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -28,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '4px',
                  fontSize: '1.4rem',
                  zIndex: 20,
                  animation: 'floatCake 3s ease-in-out infinite',
                }}>
                  {toppingEmojis.map((e, i) => <span key={i}>{e}</span>)}
                </div>
              )}

              {/* Drizzle effect */}
              {isDrizzle && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-evenly', zIndex: 15 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="drip-drop" style={{
                      background: dripColor,
                      animationDelay: `${i * 0.3}s`,
                    }} />
                  ))}
                </div>
              )}

              {/* Cake tier body */}
              <div
                style={{
                  width: '100%',
                  height: tier.height,
                  background: `linear-gradient(145deg, ${colors.top} 0%, ${colors.body} 60%, ${colors.frosting} 100%)`,
                  borderRadius: '50% 50% 50% 50% / 15% 15% 30% 30%',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: `inset 0 -20px 40px rgba(0,0,0,0.25), 0 10px 30px rgba(0,0,0,0.2)`,
                  transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  border: frosting !== 'Naked' ? `6px solid ${frostingColor}` : 'none',
                  borderBottom: 'none',
                }}
              >
                {/* Shine effect */}
                <div style={{
                  position: 'absolute',
                  top: '10%', left: '10%',
                  width: '35%', height: '35%',
                  background: 'radial-gradient(ellipse, rgba(255,255,255,0.3) 0%, transparent 70%)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }} />

                {/* Frosting swirls decoration */}
                {frosting !== 'Naked' && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    height: '25%',
                    background: `linear-gradient(to top, ${frostingColor}99, transparent)`,
                  }} />
                )}

                {/* Flavor text watermark */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  whiteSpace: 'nowrap',
                }}>
                  {flavor}
                </div>
              </div>

              {/* Tier top disc */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: Math.round(tier.height * 0.18),
                background: `linear-gradient(135deg, ${colors.top}, ${colors.frosting})`,
                borderRadius: '50%',
                boxShadow: `0 4px 12px rgba(0,0,0,0.2)`,
                border: frosting !== 'Naked' ? `4px solid ${frostingColor}` : 'none',
                zIndex: 5,
              }} />
            </div>
          );
        })}

        {/* Base plate */}
        <div style={{
          width: baseWidth + 40,
          height: 18,
          background: 'linear-gradient(180deg, #D4A017 0%, #8B6914 100%)',
          borderRadius: '50%',
          marginTop: -6,
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          zIndex: 0,
        }} />
      </div>

      {/* Shadow beneath plate */}
      <div style={{
        width: baseWidth + 20,
        height: 12,
        background: 'radial-gradient(ellipse, rgba(26,10,0,0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        marginTop: '0.25rem',
        filter: 'blur(4px)',
      }} />

      {/* Config label */}
      <div style={{
        textAlign: 'center',
        marginTop: '1rem',
        padding: '0.75rem 1.25rem',
        background: 'rgba(255,255,255,0.8)',
        borderRadius: '50px',
        backdropFilter: 'blur(10px)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <span>🎂 {tiers} Tier{tiers > 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{flavor}</span>
        <span>·</span>
        <span>{frosting}</span>
        {topping !== 'None' && <><span>·</span><span>{topping}</span></>}
      </div>
    </div>
  );
}
