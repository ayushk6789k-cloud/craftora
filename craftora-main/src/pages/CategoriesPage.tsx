import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Category } from '../types';
import { apiRequest } from '../services/api';

interface CategoriesPageProps {
  onSelectCategory: (categoryId: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onSelectCategory }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await apiRequest('/categories');
        if (res.success && res.data) {
          setCategories(res.data.categories || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="max-w-2xl">
        <span className="text-xs font-bold uppercase tracking-widest text-[#B77948]">
          Artisan Disciplines
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#29231F] mt-1">
          Explore Handcrafted Categories
        </h1>
        <p className="text-xs sm:text-sm text-[#29231F]/70 mt-2 leading-relaxed">
          From earth-fired terracotta ear-studs to hand-knotted macramé totes, each category celebrates traditional technique blended with modern everyday aesthetics.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-neutral-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group bg-white rounded-3xl overflow-hidden border border-[#D9B99B]/40 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="aspect-16/10 w-full overflow-hidden bg-[#FAF7F2] relative">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = 'true';
                      target.src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="font-display text-lg font-bold">{cat.name}</h3>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-[#29231F]/75 leading-relaxed">{cat.description}</p>
                <div className="pt-3 border-t border-[#D9B99B]/30 flex items-center justify-between text-xs font-bold text-[#7A4B35]">
                  <span>Explore Pieces</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
