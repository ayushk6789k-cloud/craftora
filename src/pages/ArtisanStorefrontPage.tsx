import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, MapPin, Instagram, Sparkles } from 'lucide-react';
import { SellerStore, Product } from '../types';
import { apiRequest } from '../services/api';
import { ProductCard } from '../components/ProductCard';

interface ArtisanStorefrontPageProps {
  artisanId: string;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
}

export const ArtisanStorefrontPage: React.FC<ArtisanStorefrontPageProps> = ({
  artisanId,
  onBack,
  onSelectProduct,
}) => {
  const [store, setStore] = useState<SellerStore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtisanData = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/products?limit=50`);
        if (res.success && res.data?.products) {
          const matchingProds = res.data.products.filter(
            (p: Product) => p.seller_id === artisanId || p.seller?.id === artisanId
          );
          setProducts(matchingProds);

          if (matchingProds.length > 0 && matchingProds[0].seller) {
            setStore(matchingProds[0].seller);
          } else {
            // Check seller stores directly
            const adminRes = await apiRequest('/seller/dashboard');
            if (adminRes.data?.store) setStore(adminRes.data.store);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchArtisanData();
  }, [artisanId]);

  return (
    <div className="space-y-8 pb-16">
      {/* Banner */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-[#FAF7F2] border-b border-[#D9B99B]/30">
        <img
          src={
            store?.banner_url ||
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80'
          }
          alt={store?.store_name || 'Artisan Studio'}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.fallbackApplied) {
              target.dataset.fallbackApplied = 'true';
              target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80';
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/90 backdrop-blur-xs text-[#29231F] hover:bg-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Artisans
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="-mt-20 relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-8 border-b border-[#D9B99B]/30">
          <div className="flex items-end gap-5">
            <img
              src={
                store?.logo_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
              }
              alt={store?.store_name}
              className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-xl bg-white"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallbackApplied) {
                  target.dataset.fallbackApplied = 'true';
                  target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
                }
              }}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#29231F]">
                  {store?.store_name || 'Artisan Studio'}
                </h1>
                {store?.is_verified && (
                  <ShieldCheck size={20} className="text-[#B77948]" />
                )}
              </div>
              <p className="text-xs font-semibold text-[#7A4B35]">{store?.tagline}</p>
              <div className="flex items-center gap-3 text-xs text-neutral-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {store?.city}, {store?.state}
                </span>
                {store?.instagram_handle && (
                  <span className="flex items-center gap-1 text-[#7A4B35] font-medium">
                    <Instagram size={13} /> @{store.instagram_handle}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#D9B99B]/40 text-center shrink-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500 block">
              Active Creations
            </span>
            <span className="font-display text-2xl font-bold text-[#7A4B35]">
              {products.length}
            </span>
          </div>
        </div>

        {/* Story Section */}
        <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <h2 className="font-display text-xl font-bold text-[#29231F]">
              About the Artisan & Medium
            </h2>
            <p className="text-xs sm:text-sm text-[#29231F]/80 leading-relaxed whitespace-pre-line bg-[#FAF7F2] p-6 rounded-2xl border border-[#D9B99B]/30">
              {store?.story ||
                'Dedicated to the craft of handmade accessories created with sustainable techniques, natural dyes, and timeless aesthetics.'}
            </p>
          </div>

          <div className="lg:col-span-4 space-y-3">
            <div className="p-5 rounded-2xl bg-white border border-[#D9B99B]/40 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A4B35]">
                Direct Maker Ethics
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                By purchasing from this studio, over 90% of order value goes directly to the creator. No middlemen or commercial sweatshops.
              </p>
            </div>
          </div>
        </div>

        {/* Products by Artisan */}
        <div className="space-y-6 pt-6 border-t border-[#D9B99B]/30">
          <h2 className="font-display text-2xl font-bold text-[#29231F]">
            Studio Creations ({products.length})
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-neutral-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">
              No products listed yet from this studio.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
