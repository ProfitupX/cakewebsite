import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, User, Menu, X, ChefHat } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, profile, signOut, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Menu' },
    { to: '/custom-order', label: 'Custom Cake' },
    { to: '/gallery', label: 'Gallery' },
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <Link to="/" className="nav-logo">🎂 Sowmis Cake</Link>

          <ul className="nav-links">
            {navLinks.map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`nav-link ${location.pathname === link.to ? 'text-rose' : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {isAdmin && (
              <li>
                <Link to="/admin" className="nav-link" style={{ color: 'var(--gold)' }}>
                  Admin Panel
                </Link>
              </li>
            )}
          </ul>

          <div className="nav-actions">
            {user ? (
              <>
                <Link to="/cart" className="nav-cart-btn">
                  <ShoppingCart size={18} />
                  <span>Cart</span>
                  {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                </Link>
                <button
                  onClick={signOut}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: '50px' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/cart" className="nav-cart-btn">
                  <ShoppingCart size={18} />
                  {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                </Link>
                <Link to="/auth" className="btn btn-primary btn-sm">
                  <User size={16} /> Sign In
                </Link>
              </>
            )}
            <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <button
          onClick={() => setMobileOpen(false)}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', padding: '0.5rem' }}
        >
          <X size={28} color="var(--text-main)" />
        </button>
        <div className="nav-logo" style={{ marginBottom: '1rem' }}>🎂 SmartBaking</div>
        {navLinks.map(link => (
          <Link key={link.to} to={link.to} className="mobile-nav-link">{link.label}</Link>
        ))}
        {isAdmin && <Link to="/admin" className="mobile-nav-link" style={{ color: 'var(--gold)' }}>Admin Panel</Link>}
        {user ? (
          <button onClick={signOut} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>Sign Out</button>
        ) : (
          <Link to="/auth" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '1rem' }}>Sign In</Link>
        )}
      </div>
    </>
  );
}
