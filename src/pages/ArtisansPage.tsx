import React, { useEffect, useState } from 'react';
import { ShieldCheck, ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { SellerStore } from '../types';
import { apiRequest } from '../services/api';

interface ArtisansPageProps {
  onSelectArtisan: (artisanId: string) => void;
  onNavigate: (route: string) => void;
}

export const ArtisansPage: React.FC<ArtisansPageProps> = ({ onSelectArtisan, onNavigate }) => {
  const [artisans, setArtisans] = useState<SellerStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtisans = async () => {
      try {
        const res = await apiRequest('/products');
        if (res.success && res.data?.products) {
          const map = new Map<string, SellerStore>();
          for (const p of res.data.products) {
            if (p.seller && !map.has(p.seller.id)) {
              map.set(p.seller.id, p.seller);
            }
          }
          setArtisans(Array.from(map.values()));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchArtisans();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="max-w-2xl">
        <span className="text-xs font-bold uppercase tracking-widest text-[#B77948]">
          Our Creative Community
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#29231F] mt-1">
          Student & Regional Artisans
        </h1>
        <p className="text-xs sm:text-sm text-[#29231F]/70 mt-2 leading-relaxed">
          Craftora bridges aspiring Fashion Design students and generational handicraft artisans directly with conscious buyers. Every piece preserves traditional making skills and supports ethical livelihoods.
        </p>
      </div>

      {/* Artisans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-neutral-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {artisans.map((artisan) => (
            <div
              key={artisan.id}
              onClick={() => onSelectArtisan(artisan.id)}
              className="bg-white rounded-3xl overflow-hidden border border-[#D9B99B]/40 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col group"
            >
              {/* Banner */}
              <div className="h-40 w-full overflow-hidden relative bg-[#FAF7F2]">
                <img
                  src={artisan.banner_url}
                  alt={artisan.store_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              {/* Body */}
              <div className="p-6 pt-0 relative flex-1 flex flex-col justify-between">
                <div>
                  {/* Logo */}
                  <div className="-mt-12 mb-3 relative inline-block">
                    <img
                      src={artisan.logo_url}
                      alt={artisan.store_name}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="font-bold text-lg text-[#29231F] group-hover:text-[#7A4B35] transition">
                      {artisan.store_name}
                    </h3>
                    {artisan.is_verified && (
                      <ShieldCheck size={16} className="text-[#B77948]" />
                    )}
                  </div>

                  <p className="text-xs font-semibold text-[#7A4B35] mb-2">{artisan.tagline}</p>
                  <p className="text-xs text-[#29231F]/75 line-clamp-3 leading-relaxed">
                    {artisan.story}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#D9B99B]/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-neutral-500">
                    <MapPin size={13} />
                    <span>
                      {artisan.city}, {artisan.state}
                    </span>
                  </div>
                  <span className="font-bold text-[#7A4B35] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Enter Studio <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Become a Seller Banner */}
      <div className="rounded-3xl bg-[#FAF7F2] border border-[#D9B99B]/40 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-[#7A4B35] uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Are you a student artisan?</span>
          </div>
          <h3 className="font-display text-2xl font-bold text-[#29231F]">
            Showcase your handcrafted creations on Craftora
          </h3>
          <p className="text-xs text-[#29231F]/75 leading-relaxed">
            Apply to list your handmade jewelry, textiles, or ceramics. Benefit from college lab verification, secure payment processing, and transparent commission payouts.
          </p>
        </div>

        <button
          onClick={() => onNavigate('seller')}
          className="bg-[#7A4B35] hover:bg-[#B77948] text-white px-6 py-3.5 rounded-2xl text-xs font-bold shrink-0 transition shadow-md cursor-pointer"
        >
          Open Artisan Studio
        </button>
      </div>
    </div>
  );
};
