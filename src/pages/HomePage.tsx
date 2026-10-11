import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Truck,
  RotateCcw,
  Palette,
  Heart,
  Store,
} from 'lucide-react';
import { Product, Category, SellerStore } from '../types';
import { apiRequest } from '../services/api';
import { ProductCard } from '../components/ProductCard';

interface HomePageProps {
  onNavigate: (route: string) => void;
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectArtisan: (artisanId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectProduct,
  onSelectCategory,
  onSelectArtisan,
}) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [artisans, setArtisans] = useState<SellerStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          apiRequest('/products?limit=8'),
          apiRequest('/categories'),
        ]);

        if (prodRes.success && prodRes.data) {
          setFeaturedProducts(prodRes.data.products || []);
        }
        if (catRes.success && catRes.data) {
          setCategories(catRes.data.categories || []);
        }

        // Fetch artisans from products sellers or store
        const storeRes = await apiRequest('/categories'); // fallback or stores
        // Extract unique sellers from products
        if (prodRes.data?.products) {
          const uniqueStores = new Map<string, SellerStore>();
          for (const p of prodRes.data.products) {
            if (p.seller && !uniqueStores.has(p.seller.id)) {
              uniqueStores.set(p.seller.id, p.seller);
            }
          }
          setArtisans(Array.from(uniqueStores.values()));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#FAF7F2] border-b border-[#D9B99B]/30 pt-10 pb-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A4B35]/10 text-[#7A4B35] text-xs font-semibold border border-[#7A4B35]/20">
                <Sparkles size={14} className="text-[#B77948]" />
                <span>Interdisciplinary Handcrafted Marketplace</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#29231F] leading-[1.12] tracking-tight">
                Authentic accessories, <br />
                <span className="text-[#7A4B35] italic font-serif">handcrafted</span> by student artisans.
              </h1>

              <p className="text-base sm:text-lg text-[#29231F]/80 max-w-xl leading-relaxed">
                Connect directly with campus creators and regional craftspersons. Every earring, tote,
                and leather clutch is handmade in micro-batches with ethical natural materials.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  id="hero-shop-btn"
                  onClick={() => onNavigate('shop')}
                  className="bg-[#7A4B35] hover:bg-[#B77948] text-white px-7 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2.5 transition shadow-md hover:shadow-lg cursor-pointer"
                >
                  Explore Handcrafted Catalog
                  <ArrowRight size={16} />
                </button>
                <button
                  id="hero-meet-artisans-btn"
                  onClick={() => onNavigate('artisans')}
                  className="bg-white hover:bg-[#FAF7F2] text-[#29231F] border border-[#D9B99B] px-6 py-3.5 rounded-2xl text-sm font-semibold transition cursor-pointer"
                >
                  Meet Student Creators
                </button>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#D9B99B]/30 max-w-lg">
                <div>
                  <p className="font-display text-2xl font-bold text-[#7A4B35]">100%</p>
                  <p className="text-xs text-[#29231F]/70 font-medium">Handmade Craft</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#7A4B35]">0%</p>
                  <p className="text-xs text-[#29231F]/70 font-medium">Mass Factory Work</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#7A4B35]">90%+</p>
                  <p className="text-xs text-[#29231F]/70 font-medium">Payout to Artisans</p>
                </div>
              </div>
            </div>

            {/* Right Artisan Showcase Collage */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Hero Image */}
                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/5 relative">
                  <img
                    src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80"
                    alt="Artisan crafting handmade jewelry"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
                      Artisan Spotlight
                    </span>
                    <p className="font-display text-lg font-bold">Mitti & Clay Studio</p>
                    <p className="text-xs text-white/80">By Ananya Sharma (Fashion Design '26)</p>
                  </div>
                </div>

                {/* Floating Micro-Badge */}
                <div className="absolute -bottom-5 -left-5 bg-white p-4 rounded-2xl shadow-xl border border-[#D9B99B]/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-[#7A4B35]">
                    <Award size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#29231F]">Campus Certified</p>
                    <p className="text-[10px] text-[#29231F]/70">Fashion Design Lab Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-white border border-[#D9B99B]/30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#FAF7F2] text-[#7A4B35]">
              <Palette size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#29231F]">Authentic Slow Craft</h4>
              <p className="text-[11px] text-[#29231F]/70">No mass production</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#FAF7F2] text-[#7A4B35]">
              <Truck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#29231F]">Free Shipping</h4>
              <p className="text-[11px] text-[#29231F]/70">On orders above ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#FAF7F2] text-[#7A4B35]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#29231F]">Razorpay Secured</h4>
              <p className="text-[11px] text-[#29231F]/70">Encrypted payments</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#FAF7F2] text-[#7A4B35]">
              <RotateCcw size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#29231F]">Fair Artisan Payout</h4>
              <p className="text-[11px] text-[#29231F]/70">Direct vendor support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Handcrafted Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#B77948]">
              Curated Mediums
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#29231F] mt-1">
              Explore by Craft Technique
            </h2>
          </div>
          <button
            onClick={() => onNavigate('categories')}
            className="text-xs font-bold text-[#7A4B35] hover:text-[#B77948] flex items-center gap-1 cursor-pointer"
          >
            All Categories <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.slice(0, 5).map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group bg-white rounded-2xl overflow-hidden border border-[#D9B99B]/30 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="aspect-square w-full overflow-hidden bg-[#FAF7F2]">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
              </div>
              <div className="p-3.5 text-center flex-1 flex flex-col justify-center bg-white">
                <h3 className="text-xs font-bold text-[#29231F] group-hover:text-[#7A4B35] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[10px] text-[#29231F]/65 mt-0.5 line-clamp-1">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Artisan Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#B77948]">
              Artisan Drops
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#29231F] mt-1">
              Handmade Accessories
            </h2>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-[#7A4B35] hover:text-[#B77948] flex items-center gap-1 cursor-pointer"
          >
            Browse All ({featuredProducts.length}+) <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-neutral-200/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(p) => onSelectProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Student Artisans Showcase */}
      <section className="bg-[#FAF7F2] py-16 border-y border-[#D9B99B]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B77948]">
              Empowering Student Makers
            </span>
            <h2 className="font-display text-3xl font-bold text-[#29231F] mt-1">
              Meet the Hands Behind the Craft
            </h2>
            <p className="text-xs sm:text-sm text-[#29231F]/75 mt-2">
              Every purchase directly sustains creative students learning design, craft heritage,
              and sustainable accessories manufacturing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {artisans.slice(0, 3).map((artisan) => (
              <div
                key={artisan.id}
                onClick={() => onSelectArtisan(artisan.id)}
                className="bg-white rounded-3xl overflow-hidden border border-[#D9B99B]/40 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col group"
              >
                <div className="h-36 w-full overflow-hidden relative">
                  <img
                    src={artisan.banner_url}
                    alt={artisan.store_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                <div className="p-6 pt-0 relative flex-1 flex flex-col justify-between">
                  <div>
                    {/* Logo Avatar */}
                    <div className="-mt-10 mb-3 relative inline-block">
                      <img
                        src={artisan.logo_url}
                        alt={artisan.store_name}
                        className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="font-bold text-base text-[#29231F] group-hover:text-[#7A4B35] transition">
                        {artisan.store_name}
                      </h3>
                      {artisan.is_verified && (
                        <ShieldCheck size={16} className="text-[#B77948]" />
                      )}
                    </div>

                    <p className="text-xs font-medium text-[#7A4B35] mb-2">{artisan.tagline}</p>
                    <p className="text-xs text-[#29231F]/75 line-clamp-3 leading-relaxed">
                      {artisan.story}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#D9B99B]/30 flex items-center justify-between text-xs">
                    <span className="text-[#29231F]/60">
                      {artisan.city}, {artisan.state}
                    </span>
                    <span className="font-bold text-[#7A4B35] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Studio <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Triad Callout Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#7A4B35] text-white p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Departmental Collaboration
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
              An Academic Experiment in Sustainable Commerce
            </h2>
            <p className="text-sm text-white/85 leading-relaxed">
              Craftora unites technical precision from Engineering (ET) with artisanal product curation from Fashion Design (FD) and real-world economics from Management (MGT). Explore the project documentation and support college-crafted sustainable accessories.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('about')}
                className="bg-white text-[#7A4B35] hover:bg-[#FAF7F2] px-6 py-3 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                Read Interdisciplinary Guide
              </button>
              <button
                onClick={() => onNavigate('seller')}
                className="bg-amber-400 hover:bg-amber-300 text-neutral-900 px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Artisan Seller Studio
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
