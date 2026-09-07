import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">🎂 SmartBaking</div>
            <p className="footer-desc">
              Crafting extraordinary cakes with love, passion and the finest ingredients.
              Every bite tells a story of artisan excellence.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              {['📸', '📘', '🐦'].map((emoji, i) => (
                <a key={i} href="#" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', borderRadius: '50%', width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Quick Links</h4>
            <div className="footer-links">
              {[['/', 'Home'], ['/menu', 'Our Menu'], ['/custom-order', 'Custom Cakes'], ['/gallery', 'Gallery']].map(([to, label]) => (
                <Link key={to} to={to} className="footer-link">{label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Categories</h4>
            <div className="footer-links">
              {['Classic Cakes', 'Gourmet Selection', 'Designer Cakes', 'Desserts', 'Cookies & More'].map(cat => (
                <span key={cat} className="footer-link" style={{ cursor: 'pointer' }}>{cat}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Newsletter</h4>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>Get exclusive offers and happy-hour alerts!</p>
            <div className="footer-input">
              <input type="email" className="footer-email" placeholder="Your email" />
              <button className="btn btn-primary btn-sm">Join</button>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>
                <Phone size={14} /><span>+91 98765 43210</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>
                <Mail size={14} /><span>hello@smartbaking.in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>
                <MapPin size={14} /><span>Baker Street, Mumbai</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2024 SmartBaking. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms</a>
            <a href="#" className="footer-link">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
