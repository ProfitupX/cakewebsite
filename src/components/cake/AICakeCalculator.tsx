import React, { useEffect, useState } from 'react';
import { Sparkles, Flame, Clock, Scale, DollarSign, ChefHat, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { calculateCakeRequirementsWithAI } from '../../lib/gemini';
import type { AICakeCalculation, CakeCustomization } from '../../types';

interface AICakeCalculatorProps {
  customization?: CakeCustomization;
  cakeName?: string;
  weightKg?: number;
  onDeductInventory?: (calc: AICakeCalculation) => void;
  showDeductButton?: boolean;
}

export default function AICakeCalculator({
  customization,
  cakeName,
  weightKg,
  onDeductInventory,
  showDeductButton = false,
}: AICakeCalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState<AICakeCalculation | null>(null);
  const [deducted, setDeducted] = useState(false);

  const flavor = customization?.flavor || 'Vanilla';
  const tiers = customization?.tiers || 1;
  const frosting = customization?.frosting || 'Buttercream';
  const topping = customization?.topping || 'None';
  const notes = customization?.message || '';
  
  const sizeMap: Record<string, number> = {
    'Small (0.5kg)': 0.5,
    'Medium (1kg)': 1,
    'Large (2kg)': 2,
    'XLarge (3kg)': 3,
  };
  const resolvedWeight = weightKg || (customization?.size ? sizeMap[customization.size] : 1) || 1;
  const resolvedName = cakeName || `${flavor} Artisan Cake`;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setDeducted(false);

    calculateCakeRequirementsWithAI({
      cake_name: resolvedName,
      weight_kg: resolvedWeight,
      tiers,
      flavor,
      frosting,
      topping,
      notes,
    }).then(res => {
      if (isMounted) {
        setCalculation(res);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [resolvedName, resolvedWeight, tiers, flavor, frosting, topping, notes]);

  const handleManualDeduct = () => {
    if (calculation && onDeductInventory) {
      onDeductInventory(calculation);
      setDeducted(true);
      setTimeout(() => setDeducted(false), 3000);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9F6 100%)',
      borderRadius: 'var(--radius-xl)',
      padding: '1.75rem',
      border: '1px solid rgba(232,25,75,0.15)',
      boxShadow: '0 10px 30px rgba(232,25,75,0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #E8194B, #FF4D75)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Sparkles size={18} />
          </div>
          <div>
            <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', margin: 0, color: 'var(--chocolate)' }}>
              AI Automated Recipe & Kitchen Calculation
            </h4>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Powered by Google Gemini Flash · Live ingredient & oven calculation
            </span>
          </div>
        </div>

        {loading ? (
          <span className="badge" style={{ background: 'rgba(232,25,75,0.1)', color: 'var(--rose)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <RefreshCw size={12} className="spin" /> Computing specs...
          </span>
        ) : (
          <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
            ⚡ AI Calibrated ({resolvedWeight} kg)
          </span>
        )}
      </div>

      {calculation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Baking Specs Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#EA580C', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                <Flame size={14} /> Oven Temp
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--chocolate)' }}>
                {calculation.baking_specs.temp_celsius}°C
              </div>
            </div>

            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#0284C7', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                <Clock size={14} /> Bake Time
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--chocolate)' }}>
                {calculation.baking_specs.bake_time_mins} min
              </div>
            </div>

            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#16A34A', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                <Scale size={14} /> Prep Time
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--chocolate)' }}>
                {calculation.baking_specs.prep_time_mins} min
              </div>
            </div>

            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#9333EA', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                <DollarSign size={14} /> Est. Cost
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--chocolate)' }}>
                ₹{calculation.cost_estimate.ingredient_cost}
              </div>
            </div>
          </div>

          {/* Ingredient Deduction List */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
              🧪 Precise Ingredients Deducted from Kitchen Inventory:
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.6rem',
            }}>
              {calculation.ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'white',
                    border: '1px solid rgba(232,25,75,0.1)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--chocolate)' }}>{ing.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>₹{ing.cost_estimate} est.</div>
                  </div>
                  <div className="badge badge-rose" style={{ fontSize: '0.78rem', fontWeight: 800, padding: '0.2rem 0.5rem' }}>
                    {ing.amount} {ing.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Baker Instructions & Tips */}
          {calculation.baker_tips.length > 0 && (
            <div style={{
              background: 'rgba(232,25,75,0.04)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              borderLeft: '3px solid var(--rose)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--rose)', marginBottom: '0.3rem' }}>
                <ChefHat size={15} /> AI Master Baker Recommendation
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.45 }}>
                {calculation.baker_tips.map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: '0.2rem' }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Optional Direct Manual Deduction Button (for admin/kitchen view) */}
          {showDeductButton && onDeductInventory && (
            <button
              onClick={handleManualDeduct}
              disabled={deducted}
              className={`btn btn-sm ${deducted ? 'btn-green' : 'btn-primary'}`}
              style={{ width: '100%', justifyContent: 'center', borderRadius: '8px', padding: '0.6rem' }}
            >
              {deducted ? (
                <>
                  <Check size={16} /> Ingredients Deducted from Database Stock!
                </>
              ) : (
                <>
                  <Scale size={16} /> Deduct Calculated Ingredients From Kitchen Inventory Now
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
