import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  count?: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  count,
  showText = true,
  size = 'sm',
}) => {
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 20;

  return (
    <div className="flex items-center gap-1.5" id="star-rating-container">
      <div className="flex items-center text-[#B77948]">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={iconSize}
            className={`${
              star <= Math.round(rating)
                ? 'fill-[#B77948] text-[#B77948]'
                : 'text-[#D9B99B]'
            }`}
          />
        ))}
      </div>
      {showText && (
        <span className="text-xs font-medium text-[#29231F]/75">
          {rating.toFixed(1)} {count !== undefined && `(${count})`}
        </span>
      )}
    </div>
  );
};
