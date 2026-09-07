import React, { useState, useEffect } from 'react';
import { getActiveHappyHours } from '../../lib/database';
import { isHappyHourActive, getSecondsUntilHappyHourEnd } from '../../utils/pricingUtils';
import type { HappyHour } from '../../types';

interface HappyHourTimerProps {
  onDiscountChange?: (discount: number) => void;
}

export default function HappyHourTimer({ onDiscountChange }: HappyHourTimerProps) {
  const [activeHH, setActiveHH] = useState<HappyHour | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHappyHours() {
      try {
        const hours = await getActiveHappyHours();
        const now = new Date();
        const active = hours.find(hh =>
          isHappyHourActive(hh.start_time, hh.end_time, hh.days_of_week)
        );
        setActiveHH(active || null);
        if (active) {
          setTimeLeft(getSecondsUntilHappyHourEnd(active.end_time));
          onDiscountChange?.(active.discount_percent);
        } else {
          onDiscountChange?.(0);
        }
      } catch {
        setActiveHH(null);
      }
      setLoading(false);
    }
    fetchHappyHours();
    const interval = setInterval(fetchHappyHours, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeHH || timeLeft <= 0) return;
    const tick = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setActiveHH(null); onDiscountChange?.(0); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [activeHH, timeLeft]);

  if (loading || !activeHH) return null;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="happy-hour-banner">
      <div>
        <div className="badge badge-gold" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
          ⚡ FLASH SALE LIVE
        </div>
        <h2 style={{ color: 'white', marginBottom: '0.5rem', fontFamily: 'Playfair Display, serif' }}>
          Happy Hour! {activeHH.discount_percent}% OFF
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
          {activeHH.name} — Limited time offer on all cakes!
        </p>
      </div>

      <div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Ends In
        </div>
        <div className="timer-display">
          <div className="timer-unit">
            <div className="timer-num">{pad(hours)}</div>
            <div className="timer-label">Hrs</div>
          </div>
          <div style={{ color: 'white', fontSize: '2.5rem', fontWeight: 900, alignSelf: 'center', marginBottom: '0.5rem' }}>:</div>
          <div className="timer-unit">
            <div className="timer-num">{pad(minutes)}</div>
            <div className="timer-label">Min</div>
          </div>
          <div style={{ color: 'white', fontSize: '2.5rem', fontWeight: 900, alignSelf: 'center', marginBottom: '0.5rem' }}>:</div>
          <div className="timer-unit">
            <div className="timer-num">{pad(seconds)}</div>
            <div className="timer-label">Sec</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo version (always shows timer for demonstration without DB)
export function HappyHourTimerDemo({ discount = 20 }: { discount?: number }) {
  const [timeLeft, setTimeLeft] = useState(3600 + 25 * 60 + 0); // 1h 25m demo

  useEffect(() => {
    const tick = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(tick);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="happy-hour-banner">
      <div>
        <div className="badge badge-gold" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
          ⚡ FLASH SALE LIVE
        </div>
        <h2 style={{ color: 'white', marginBottom: '0.5rem', fontFamily: 'Playfair Display, serif' }}>
          Happy Hour! {discount}% OFF Everything!
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
          Evening Special — Grab your cakes before the deal ends!
        </p>
      </div>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Ends In
        </div>
        <div className="timer-display">
          {[{v: pad(hours), l: 'Hrs'}, {v: pad(minutes), l: 'Min'}, {v: pad(seconds), l: 'Sec'}].map((u, i) => (
            <React.Fragment key={u.l}>
              {i > 0 && <div style={{ color: 'white', fontSize: '2.5rem', fontWeight: 900, alignSelf: 'center', marginBottom: '0.5rem' }}>:</div>}
              <div className="timer-unit">
                <div className="timer-num">{u.v}</div>
                <div className="timer-label">{u.l}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
