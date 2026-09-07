import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}

export default function StarRating({ rating, onRate, size = 'md', readOnly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const sizes = { sm: '1rem', md: '1.4rem', lg: '2rem' };
  const display = hovered || rating;

  return (
    <div className="stars" style={{ cursor: readOnly ? 'default' : 'pointer' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`star ${i < display ? 'filled' : 'empty'}`}
          style={{ fontSize: sizes[size], transition: 'transform 0.15s' }}
          onMouseEnter={() => !readOnly && setHovered(i + 1)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => !readOnly && onRate?.(i + 1)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
