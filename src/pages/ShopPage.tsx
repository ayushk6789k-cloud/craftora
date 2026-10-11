import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, Search, X, Check } from 'lucide-react';
import { Product, Category } from '../types';
import { apiRequest } from '../services/api';
import { ProductCard } from '../components/ProductCard';

interface ShopPageProps {
  initialSearch?: string;
  initialCategory?: string;
  onSelectProduct: (product: Product) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  initialSearch = '',
  initialCategory = '',
  onSelectProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [customizableOnly, setCustomizableOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showMobileFilter, setShowMobileFilter] = useState<boolean>(false);

  const materials = [
    'Terracotta Clay',
    'Cotton Macramé',
    'Brass',
    'Silk Brocade',
    'Full Grain Leather',
    'Resin',
    'Sterling Silver',
    'Glass Beads',
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedCategory) queryParams.append('category_id', selectedCategory);
      if (selectedMaterial) queryParams.append('material', selectedMaterial);
      if (maxPrice) queryParams.append('max_price', (maxPrice * 100).toString());
      if (sortBy) queryParams.append('sort', sortBy);
      if (inStockOnly) queryParams.append('in_stock', 'true');

      const res = await apiRequest(`/products?${queryParams.toString()}`);
      if (res.success && res.data) {
        let list: Product[] = res.data.products || [];
        if (customizableOnly) {
          list = list.filter((p) => p.customization_available);
        }
        setProducts(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCats = async () => {
      const res = await apiRequest('/categories');
      if (res.success && res.data) {
        setCategories(res.data.categories || []);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, selectedMaterial, maxPrice, inStockOnly, customizableOnly, sortBy]);

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedMaterial('');
    setMaxPrice(3000);
    setInStockOnly(false);
    setCustomizableOnly(false);
    setSortBy('newest');
  };

  const hasActiveFilters =
    search || selectedCategory || selectedMaterial || maxPrice < 3000 || inStockOnly || customizableOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#B77948]">
            Catalog
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#29231F] mt-1">
            Handcrafted Accessories
          </h1>
          <p className="text-xs sm:text-sm text-[#29231F]/70 mt-1">
            Browse authentic handmade jewelry, bags, and keepsakes made by campus artisans.
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-[#D9B99B]/50 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#7A4B35] w-48 sm:w-60"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-[#D9B99B]/50 rounded-xl px-3 py-2 text-xs font-semibold text-[#29231F] focus:outline-none focus:border-[#7A4B35] cursor-pointer"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          <button
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="lg:hidden p-2 rounded-xl bg-white border border-[#D9B99B]/50 text-[#7A4B35] cursor-pointer"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside
          className={`lg:block ${
            showMobileFilter ? 'block' : 'hidden'
          } bg-[#FAF7F2] p-6 rounded-2xl border border-[#D9B99B]/30 h-fit space-y-6`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#D9B99B]/30">
            <div className="flex items-center gap-2 text-sm font-bold text-[#29231F]">
              <Filter size={16} className="text-[#7A4B35]" />
              <span>Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-[#7A4B35] hover:underline font-semibold cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A4B35] mb-2.5">
              Category
            </h4>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer flex justify-between ${
                  !selectedCategory ? 'bg-[#7A4B35] text-white' : 'hover:bg-white text-[#29231F]'
                }`}
              >
                <span>All Categories</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer flex justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-[#7A4B35] text-white'
                      : 'hover:bg-white text-[#29231F]'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A4B35]">
                Max Price
              </h4>
              <span className="text-xs font-bold text-[#29231F]">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="200"
              max="3000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#7A4B35] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
              <span>₹200</span>
              <span>₹3,000</span>
            </div>
          </div>

          {/* Materials */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A4B35] mb-2.5">
              Medium & Material
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {materials.map((mat) => (
                <button
                  key={mat}
                  onClick={() => setSelectedMaterial(selectedMaterial === mat ? '' : mat)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                    selectedMaterial === mat
                      ? 'bg-[#7A4B35] text-white border-[#7A4B35]'
                      : 'bg-white text-[#29231F] border-[#D9B99B]/40 hover:border-[#7A4B35]'
                  }`}
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-[#D9B99B]/30 space-y-2.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-[#7A4B35] focus:ring-[#7A4B35] accent-[#7A4B35]"
              />
              <span className="font-medium text-[#29231F]">In Stock Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={customizableOnly}
                onChange={(e) => setCustomizableOnly(e.target.checked)}
                className="rounded text-[#7A4B35] focus:ring-[#7A4B35] accent-[#7A4B35]"
              />
              <span className="font-medium text-[#29231F]">Custom Orders Available</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-[#29231F]/70 font-medium">
              Showing <strong className="text-[#29231F]">{products.length}</strong> handcrafted items
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-neutral-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-[#FAF7F2] rounded-3xl p-12 text-center border border-[#D9B99B]/30">
              <h3 className="font-display text-lg font-bold text-[#29231F] mb-1">
                No matching handcrafted creations
              </h3>
              <p className="text-xs text-[#29231F]/70 max-w-sm mx-auto mb-6">
                Try widening your price range, clearing filters, or searching for other craft materials.
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-[#7A4B35] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#B77948] transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
