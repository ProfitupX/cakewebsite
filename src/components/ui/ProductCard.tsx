import React from 'react';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
  happyHourDiscount?: number;
  onClick?: () => void;
}

export default function ProductCard({ product, happyHourDiscount = 0, onClick }: ProductCardProps) {
  const { addProduct } = useCart();
  const discountedPrice = happyHourDiscount > 0
    ? Math.round(product.base_price * (1 - happyHourDiscount / 100))
    : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addProduct(product);
  };

  return (
    <div className="product-card" onClick={onClick} style={{ position: 'relative' }}>
      {product.is_bestseller && (
        <div className="badge badge-rose" style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 2 }}>
          ⭐ Bestseller
        </div>
      )}
      {happyHourDiscount > 0 && (
        <div className="badge badge-gold" style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 2 }}>
          -{happyHourDiscount}%
        </div>
      )}
      <div style={{ overflow: 'hidden' }}>
        <img
          src={product.image_url || `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80`}
          alt={product.name}
          className="card-img"
          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
        />
      </div>
      <div style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontFamily: 'Playfair Display, serif', marginBottom: '0.35rem', color: 'var(--chocolate)' }}>
          {product.name}
        </h3>
        <div className="stars" style={{ marginBottom: '0.75rem' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`star ${i < Math.round(product.rating) ? 'filled' : 'empty'}`}>★</span>
          ))}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>({product.review_count})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div>
            {discountedPrice ? (
              <>
                <span className="price-tag" style={{ fontSize: '1.3rem' }}>₹{discountedPrice}</span>
                <span className="price-original" style={{ fontSize: '0.85rem' }}>₹{product.base_price}</span>
              </>
            ) : (
              <span className="price-tag" style={{ fontSize: '1.3rem' }}>₹{product.base_price}</span>
            )}
          </div>
          <button onClick={handleAdd} className="btn btn-primary btn-sm btn-icon" aria-label="Add to cart">
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
