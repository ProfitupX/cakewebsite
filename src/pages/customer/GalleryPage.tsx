import React, { useState } from 'react';
import { motion } from 'framer-motion';
import StarRating from '../../components/ui/StarRating';
import { Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { submitReview } from '../../lib/database';

const GALLERY_IMGS = [
  { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80', cake: 'Chocolate Truffle' },
  { url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&q=80', cake: 'Red Velvet' },
  { url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&q=80', cake: 'Mango Mousse' },
  { url: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=500&q=80', cake: 'Black Forest' },
  { url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&q=80', cake: 'Strawberry' },
  { url: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=500&q=80', cake: 'Lemon Drizzle' },
  { url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&q=80', cake: 'Butterscotch' },
  { url: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=500&q=80', cake: 'Designer' },
  { url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80', cake: 'Cookies' },
];

const REVIEWS = [
  { name: 'Priya Sharma', rating: 5, comment: 'Absolutely divine! The chocolate truffle was perfection.', date: '2024-01-15' },
  { name: 'Rahul Mehta', rating: 5, comment: 'Best custom cake experience ever. The red velvet was moist.', date: '2024-01-12' },
  { name: 'Anjali Patel', rating: 4, comment: 'The mango mousse cake was heavenly! Will definitely order again.', date: '2024-01-10' },
  { name: 'Deepak Nair', rating: 5, comment: 'Ordered a custom 3-tier wedding cake. Team nailed every detail!', date: '2024-01-08' },
  { name: 'Sunita Gupta', rating: 5, comment: 'Happy Hour deal was incredible. Fresh, delicious, delivered on time!', date: '2024-01-05' },
  { name: 'Arjun Singh', rating: 4, comment: 'Lemon drizzle was refreshingly different. Great balance!', date: '2024-01-03' },
];

export default function GalleryPage() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;
    setSubmitting(true);
    try { await submitReview(user.id, rating, comment); setSubmitted(true); setComment(''); } catch {}
    setSubmitting(false);
  };

  return (
    <div className="page-enter" style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ background: 'linear-gradient(135deg, #1A0A00 0%, #3D1A00 100%)', padding: '4rem 0 3rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="tag" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}>Gallery</span>
          <h1 style={{ color: 'white', marginTop: '0.75rem', marginBottom: '1rem' }}>Our Creations Gallery</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 500, margin: '0 auto' }}>Real cakes, real customers, real happiness.</p>
        </div>
      </div>
      <div className="container" style={{ paddingTop: '3rem' }}>
        <div className="section-header"><span className="tag">Our Creations</span><h2>Cake Gallery</h2></div>
        <div style={{ columns: 3, gap: '1rem', marginBottom: '4rem' }}>
          {GALLERY_IMGS.map((img, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} style={{ marginBottom: '1rem', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', position: 'relative', breakInside: 'avoid' }} onClick={() => setSelectedImg(img.url)}>
              <img src={img.url} alt={img.cake} style={{ width: '100%', display: 'block', borderRadius: 16, transition: 'transform 0.4s' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem 1rem 0.75rem', background: 'linear-gradient(to top, rgba(26,10,0,0.8), transparent)', borderRadius: '0 0 16px 16px' }}>
                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>{img.cake}</span>
              </div>
            </motion.div>
          ))}
        </div>
        {selectedImg && (
          <div onClick={() => setSelectedImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', cursor: 'pointer' }}>
            <img src={selectedImg} alt="" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 20, objectFit: 'contain' }} />
          </div>
        )}
        <div className="section-header"><span className="tag">Customer Stories</span><h2>Reviews</h2></div>
        <div className="reviews-grid" style={{ marginBottom: '4rem' }}>
          {REVIEWS.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="review-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="review-avatar" style={{ background: 'rgba(232,25,75,0.1)', color: 'var(--rose)' }}>{r.name.charAt(0)}</div>
                  <div><div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.date}</div></div>
                </div>
                <StarRating rating={r.rating} readOnly size="sm" />
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic' }}>'{r.comment}'</p>
            </motion.div>
          ))}
        </div>
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: 'var(--shadow-card)', maxWidth: 600, margin: '0 auto 4rem' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '1.5rem' }}>Share Your Experience</h3>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#22C55E' }}><div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✓</div><p style={{ fontWeight: 700 }}>Thank you!</p></div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}><label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Rating</label><StarRating rating={rating} onRate={setRating} size="lg" /></div>
              <div style={{ marginBottom: '1.25rem' }}><label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Review</label><textarea className="input-field" rows={4} placeholder="Tell us about your experience..." value={comment} onChange={e => setComment(e.target.value)} required style={{ resize: 'vertical' }} /></div>
              {!user && <p style={{ color: 'var(--rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>Please sign in to submit a review.</p>}
              <button type="submit" disabled={!user || submitting} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {submitting ? 'Submitting...' : <><Send size={16} /> Submit Review</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
