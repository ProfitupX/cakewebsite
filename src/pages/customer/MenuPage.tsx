import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import ProductCard from '../../components/ui/ProductCard';
import type { Product } from '../../types';
import { getProducts } from '../../lib/database';

const CATEGORIES = [
  { key: 'All', emoji: '🎂' },
  { key: 'Classic', emoji: '🎂' },
  { key: 'Gourmet', emoji: '👑' },
  { key: 'Designer', emoji: '🎨' },
  { key: 'Desserts', emoji: '🍰' },
  { key: 'Cookies', emoji: '🍪' },
];

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Chocolate Truffle', description: 'Rich dark chocolate ganache', base_price: 799, category: 'Classic', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', rating: 4.9, review_count: 342, is_bestseller: true, is_available: true, weight_kg: 1, created_at: '' },
  { id: '2', name: 'Red Velvet Dream', description: 'Classic red velvet with cream cheese', base_price: 899, category: 'Classic', image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80', rating: 4.8, review_count: 218, is_bestseller: true, is_available: true, weight_kg: 1, created_at: '' },
  { id: '3', name: 'Mango Mousse', description: 'Fresh Alphonso mango mousse', base_price: 749, category: 'Gourmet', image_url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80', rating: 4.7, review_count: 189, is_bestseller: true, is_available: true, weight_kg: 1, created_at: '' },
  { id: '4', name: 'Black Forest', description: 'German classic with cherries', base_price: 699, category: 'Classic', image_url: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=400&q=80', rating: 4.8, review_count: 276, is_bestseller: true, is_available: true, weight_kg: 1, created_at: '' },
  { id: '5', name: 'Strawberry Bliss', description: 'Fresh strawberries and whipped cream', base_price: 649, category: 'Classic', image_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80', rating: 4.6, review_count: 154, is_bestseller: true, is_available: true, weight_kg: 1, created_at: '' },
  { id: '6', name: 'Lemon Drizzle', description: 'Zesty lemon sponge with glaze', base_price: 599, category: 'Gourmet', image_url: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400&q=80', rating: 4.5, review_count: 98, is_bestseller: false, is_available: true, weight_kg: 1, created_at: '' },
  { id: '7', name: 'Butterscotch Delight', description: 'Classic butterscotch caramel', base_price: 649, category: 'Classic', image_url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80', rating: 4.7, review_count: 132, is_bestseller: false, is_available: true, weight_kg: 1, created_at: '' },
  { id: '8', name: 'Pistachio Rose', description: 'Middle Eastern rose water and pistachio', base_price: 1199, category: 'Gourmet', image_url: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=400&q=80', rating: 4.9, review_count: 87, is_bestseller: false, is_available: true, weight_kg: 1, created_at: '' },
  { id: '9', name: 'Tiramisu Tower', description: 'Italian espresso mascarpone', base_price: 999, category: 'Desserts', image_url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80', rating: 4.8, review_count: 203, is_bestseller: false, is_available: true, weight_kg: 1, created_at: '' },
  { id: '10', name: 'Choco Chip Cookies', description: 'Box of 24 classic cookies', base_price: 299, category: 'Cookies', image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80', rating: 4.6, review_count: 445, is_bestseller: true, is_available: true, weight_kg: 0.5, created_at: '' },
  { id: '11', name: 'Designer Floral', description: 'Edible flower fondant masterpiece', base_price: 2499, category: 'Designer', image_url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80', rating: 5.0, review_count: 67, is_bestseller: false, is_available: true, weight_kg: 2, created_at: '' },
  { id: '12', name: 'Pineapple Paradise', description: 'Fresh pineapple with toasted coconut', base_price: 549, category: 'Classic', image_url: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=400&q=80', rating: 4.4, review_count: 178, is_bestseller: false, is_available: true, weight_kg: 1, created_at: '' },
];

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    getProducts().then(data => { if (data?.length) setProducts(data); }).catch(() => {});
  }, []);

  const filtered = products
    .filter(p => activeCategory === 'All' || p.category === activeCategory)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'popular') return b.review_count - a.review_count;
      if (sortBy === 'price-asc') return a.base_price - b.base_price;
      if (sortBy === 'price-desc') return b.base_price - a.base_price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="page-enter" style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ background: 'linear-gradient(135deg, #1A0A00 0%, #3D1A00 100%)', padding: '4rem 0 3rem' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: '2rem' }}>
            <span className="tag" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}>Our Collection</span>
            <h2 style={{ color: 'white' }}>The Complete Menu</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>From classic cakes to exotic creations — everything baked with love.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search cakes..." value={search} onChange={e => setSearch(e.target.value)} className="input-field" style={{ paddingLeft: '3rem' }} />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field" style={{ maxWidth: 180 }}>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`btn btn-sm ${activeCategory === cat.key ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '50px' }}>
              {cat.emoji} {cat.key}
            </button>
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Showing <strong>{filtered.length}</strong> cakes</p>
        <div className="products-grid">
          {filtered.map((product, i) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <h3>No cakes found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
