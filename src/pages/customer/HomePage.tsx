import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Truck, Award, Clock, Heart, ChevronRight } from 'lucide-react';
import { getProducts, getBestsellers, getApprovedReviews } from '../../lib/database';
import { HappyHourTimerDemo } from '../../components/ui/HappyHourTimer';
import ProductCard from '../../components/ui/ProductCard';
import type { Product, Review } from '../../types';

// Image paths (generated images)
const HERO_IMG = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=90';
const CAKE_IMGS = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80',
  'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80',
  'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=400&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80',
  'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400&q=80',
];

const CATEGORIES = [
  { name: 'Classic', emoji: '🎂', color: '#E8194B', img: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=300&q=80' },
  { name: 'Gourmet', emoji: '👑', color: '#D4A017', img: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=300&q=80' },
  { name: 'Designer', emoji: '🎨', color: '#8B5CF6', img: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=300&q=80' },
  { name: 'Desserts', emoji: '🍰', color: '#F97316', img: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=300&q=80' },
  { name: 'Cookies', emoji: '🍪', color: '#22C55E', img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80' },
  { name: 'Cupcakes', emoji: '🧁', color: '#EC4899', img: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=300&q=80' },
];

const MOCK_BESTSELLERS: Product[] = [
  { id: '1', name: 'Chocolate Truffle', description: 'Rich dark chocolate', base_price: 799, category: 'Classic', image_url: CAKE_IMGS[0], rating: 4.9, review_count: 342, is_bestseller: true, is_available: true, weight_kg: 1, created_at: '' },
  { id: '2', name: 'Red Velvet Dream', description: 'Classic red velvet', base_price: 899, category: 'Classic', image_url: CAKE_IMGS[1], rating: 4.8, review_count: 218, is_bestseller: true, is_available: true, weight_kg: 1, created_at: '' },
  { id: '3', name: 'Mango Mousse', description: 'Tropical mango delight', base_price: 749, category: 'Gourmet', image_url: CAKE_IMGS[2], rating: 4.7, review_count: 189, is_bestseller: true, is_available: true, weight_kg: 1, created_at: '' },
  { id: '4', name: 'Black Forest', description: 'Cherry & chocolate', base_price: 699, category: 'Classic', image_url: CAKE_IMGS[3], rating: 4.8, review_count: 276, is_bestseller: true, is_available: true, weight_kg: 1, created_at: '' },
  { id: '5', name: 'Strawberry Bliss', description: 'Fresh strawberries', base_price: 649, category: 'Classic', image_url: CAKE_IMGS[4], rating: 4.6, review_count: 154, is_bestseller: true, is_available: true, weight_kg: 1, created_at: '' },
  { id: '6', name: 'Lemon Drizzle', description: 'Zesty citrus cake', base_price: 599, category: 'Gourmet', image_url: CAKE_IMGS[5], rating: 4.5, review_count: 98, is_bestseller: false, is_available: true, weight_kg: 1, created_at: '' },
];

const MOCK_REVIEWS: Review[] = [
  { id: '1', user_id: 'u1', rating: 5, comment: 'Absolutely divine! The chocolate truffle cake was perfection. My guests were blown away!', is_approved: true, created_at: new Date().toISOString(), profile: { id: 'u1', email: '', full_name: 'Priya Sharma', role: 'customer', created_at: '' } },
  { id: '2', user_id: 'u2', rating: 5, comment: 'Best custom cake experience ever. The red velvet was moist and the cream cheese frosting was spot on.', is_approved: true, created_at: new Date().toISOString(), profile: { id: 'u2', email: '', full_name: 'Rahul Mehta', role: 'customer', created_at: '' } },
  { id: '3', user_id: 'u3', rating: 4, comment: 'The mango mousse cake was heavenly! Will definitely order again for my next celebration.', is_approved: true, created_at: new Date().toISOString(), profile: { id: 'u3', email: '', full_name: 'Anjali Patel', role: 'customer', created_at: '' } },
  { id: '4', user_id: 'u4', rating: 5, comment: 'Ordered a custom 3-tier wedding cake. The team nailed every detail. Guests kept asking where we got it!', is_approved: true, created_at: new Date().toISOString(), profile: { id: 'u4', email: '', full_name: 'Deepak Nair', role: 'customer', created_at: '' } },
];

const fadeIn = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function HomePage() {
  const [bestsellers, setBestsellers] = useState<Product[]>(MOCK_BESTSELLERS);
  const [reviews] = useState<Review[]>(MOCK_REVIEWS);
  const [activeCategory, setActiveCategory] = useState('All');
  const heroRef = useRef<HTMLDivElement>(null);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    getBestsellers().then(data => { if (data?.length) setBestsellers(data); }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) setParallaxY(window.scrollY * 0.3);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="page-enter">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #1A0A00 0%, #3D1A00 35%, #7B1A30 70%, #C0103A 100%)',
          transform: `translateY(${parallaxY}px)`,
          willChange: 'transform',
        }} />

        {/* Decorative circles */}
        {[300, 500, 700].map((size, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: size, height: size,
            borderRadius: '50%',
            border: '1px solid rgba(232,25,75,0.15)',
            top: '50%', right: '-10%',
            transform: 'translateY(-50%)',
            animation: `floatCake ${4 + i * 1.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }} />
        ))}

        <div className="container" style={{ position: 'relative', zIndex: 2, paddingTop: '6rem', paddingBottom: '4rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            {/* Left */}
            <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ duration: 0.7 }}>
              <div className="hero-tag">🎂 Welcome to Sowmis Cake — Luxury Artisan Bakery</div>
              <h1 className="hero-title">
                Bake More Than
                <span style={{ color: '#FF8FAB' }}>Memories</span>
              </h1>
              <p className="hero-desc">
                Handcrafted luxury cakes baked with love & AI smart precision. Design your dream 3D cake, track it live, and savor every bite.
              </p>
              <div className="hero-actions">
                <Link to="/custom-order" className="btn btn-primary btn-lg">
                  Design Your Cake <ArrowRight size={20} />
                </Link>
                <Link to="/menu" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: '50px', padding: '0.75rem 1.75rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  Explore Menu
                </Link>
              </div>

              <div className="hero-stats">
                {[['2M+', 'Happy Customers'], ['500+', 'Cake Designs'], ['4.9★', 'Rating'], ['15+', 'Cities']].map(([num, label]) => (
                  <div key={label} className="hero-stat">
                    <div className="num">{num}</div>
                    <div className="label">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right - Hero Image */}
            <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.9, delay: 0.2 }} className="hero-img-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative' }}>
                <img src={HERO_IMG} alt="Signature Cake" style={{ width: 480, height: 520, objectFit: 'cover', borderRadius: 40, boxShadow: '0 40px 80px rgba(232,25,75,0.3), 0 0 0 1px rgba(255,255,255,0.1)' }} />
                {/* Floating badges */}
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} style={{ position: 'absolute', top: '1.5rem', left: '-3rem', background: 'white', borderRadius: 16, padding: '0.75rem 1.25rem', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                  <div style={{ fontWeight: 800, color: '#E8194B', fontSize: '1.1rem' }}>⭐ 4.9</div>
                  <div style={{ fontSize: '0.72rem', color: '#7B6B5E' }}>2M+ Reviews</div>
                </motion.div>
                <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 1 }} style={{ position: 'absolute', bottom: '2rem', right: '-2.5rem', background: 'linear-gradient(135deg, #E8194B, #FF4D75)', borderRadius: 16, padding: '0.75rem 1.25rem', boxShadow: '0 8px 32px rgba(232,25,75,0.4)' }}>
                  <div style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>🎂 Custom</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)' }}>Design Yours</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)', animation: 'floatCake 2s ease-in-out infinite' }}>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</div>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)' }} />
        </div>
      </section>

      {/* ── HAPPY HOUR TIMER ──────────────────────────────────── */}
      <section className="container" style={{ paddingTop: '4rem' }}>
        <HappyHourTimerDemo discount={25} />
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────── */}
      <section className="section-padding container">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} transition={{ duration: 0.6 }}>
          <div className="section-header">
            <span className="tag">Browse by Category</span>
            <h2>Menu: What Will You Wish For?</h2>
            <p>From classic celebratory cakes to artisan gourmet creations — find your perfect match.</p>
          </div>

          <div className="categories-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link to={`/menu?category=${cat.name}`}>
                  <div className="category-card" style={{ height: 180 }}>
                    <img src={cat.img} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div className="cat-overlay" style={{ background: `linear-gradient(to top, ${cat.color}CC 0%, transparent 60%)` }}>
                      <div>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{cat.emoji}</div>
                        <div className="cat-name">{cat.name}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── BESTSELLERS ───────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(180deg, #fff5f0 0%, #FFE8DC 100%)', padding: '5rem 0' }}>
        <div className="container">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', textAlign: 'left', marginBottom: '2.5rem' }}>
            <div>
              <span className="tag">India Loves These</span>
              <h2>Bestsellers from Across the Country</h2>
            </div>
            <Link to="/menu" className="btn btn-secondary" style={{ flexShrink: 0 }}>
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="products-grid">
            {bestsellers.slice(0, 6).map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CUSTOM CAKE CTA ───────────────────────────────────── */}
      <section className="section-padding container">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <div style={{
            background: 'linear-gradient(135deg, #1A0A00 0%, #3D1A00 50%, #7B1A30 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: '5rem 4rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Decorative */}
            <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(232,25,75,0.1)' }} />
            <div>
              <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>🎂 Custom Builder</span>
              <h2 style={{ color: 'white', marginBottom: '1rem' }}>Design Your Dream Cake</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: 1.7 }}>
                Pick your flavor, tiers, frosting, and toppings. Watch your cake come to life in real-time 3D. Perfect for every celebration!
              </p>
              <Link to="/custom-order" className="btn btn-gold btn-lg">
                Start Designing <ArrowRight size={20} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {['🍫 6 Flavors', '🎂 1-3 Tiers', '🧈 4 Frostings', '🍓 6 Toppings', '📏 4 Sizes', '✍️ Custom Message'].map(feat => (
                <div key={feat} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 600 }}>
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── OUR PROMISE ───────────────────────────────────────── */}
      <section style={{ background: 'white', padding: '5rem 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="tag">Why Choose Us</span>
            <h2>Our Promise to You</h2>
          </div>
          <div className="promise-grid">
            {[
              { icon: '🚚', title: 'On-Time Delivery', desc: 'Guaranteed delivery as promised' },
              { icon: '🎨', title: '500+ Designs', desc: 'Unique and creative cake art' },
              { icon: '🏆', title: '2Cr+ Orders', desc: 'Trusted by millions across India' },
              { icon: '👨‍🍳', title: 'Baked Fresh', desc: 'Made to order every single time' },
              { icon: '🌿', title: 'Premium Ingredients', desc: 'Only the finest ingredients used' },
              { icon: '💝', title: 'Made with Love', desc: 'Passion in every slice' },
            ].map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="promise-card">
                <div className="promise-icon">{p.icon}</div>
                <h4 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '0.4rem', fontSize: '1rem' }}>{p.title}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ───────────────────────────────────────────── */}
      <section style={{ background: 'var(--cream)', padding: '5rem 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="tag">Customer Love</span>
            <h2>What's In Your Heart?</h2>
            <p>Real words from real customers who tasted the magic.</p>
          </div>
          <div className="reviews-grid">
            {reviews.map((review, i) => (
              <motion.div key={review.id} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="review-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="review-avatar">
                    {review.profile?.full_name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{review.profile?.full_name}</div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ color: i < review.rating ? 'var(--gold)' : '#D1C4B8', fontSize: '0.85rem' }}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{review.comment}"
                </p>
              </motion.div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/gallery" className="btn btn-primary">
              View All Reviews <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
