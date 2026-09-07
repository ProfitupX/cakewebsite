import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CakeCustomizer from '../../components/cake/CakeCustomizer';
import { HappyHourTimerDemo } from '../../components/ui/HappyHourTimer';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export default function CustomOrderPage() {
  const navigate = useNavigate();
  return (
    <div className="page-enter" style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ background: 'linear-gradient(135deg, #1A0A00 0%, #3D1A00 60%, #7B1A30 100%)', padding: '4rem 0 3rem' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
            <span className="tag" style={{ background: 'rgba(232,25,75,0.2)', color: '#FF8FAB' }}>🎨 Custom Builder</span>
            <h1 style={{ color: 'white', marginTop: '0.75rem', marginBottom: '1rem' }}>Design Your Dream Cake</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto' }}>Every choice updates your 3D cake preview in real-time. Make it perfect, then add to cart!</p>
          </motion.div>
        </div>
      </div>
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}><HappyHourTimerDemo discount={20} /></div>
        <CakeCustomizer happyHourDiscount={0} />
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button onClick={() => navigate('/cart')} className="btn btn-secondary btn-lg">
            <ShoppingCart size={20} /> View Cart
          </button>
        </div>
      </div>
    </div>
  );
}
