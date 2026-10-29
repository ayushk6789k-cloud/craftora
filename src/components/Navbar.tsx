import React, { useState } from 'react';
import {
  ShoppingBag,
  Heart,
  User,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
  BarChart3,
  ShieldCheck,
  Store,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onSearch?: (query: string) => void;
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  onSearch,
  onOpenCart,
}) => {
  const { user, logout } = useAuth();
  const { itemCount, setIsCartDrawerOpen } = useCart();
  const { wishlistIds } = useWishlist();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`shop?search=${encodeURIComponent(searchQuery.trim())}`);
      onSearch?.(searchQuery.trim());
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    onNavigate('login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#D9B99B]/35">
      {/* Top Marketplace Announcement Bar */}
      <div className="bg-[#7A4B35] text-[#FAF7F2] text-xs py-1.5 px-4 font-medium flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#B77948] px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">
              Artisan Direct
            </span>
            <span className="text-white/90 text-xs">
              Handcrafted accessories made with ethically sourced materials • Free shipping on orders over ₹999
            </span>
          </div>

          {/* Genuine Auth Status Banner */}
          <div className="flex items-center gap-3 text-xs">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-white/80 hidden sm:inline">Signed in:</span>
                <span className="font-semibold text-white truncate max-w-[140px]">{user.full_name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {user.role}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <button
                  id="top-signin-btn"
                  onClick={() => onNavigate('login')}
                  className="hover:text-amber-200 transition font-medium cursor-pointer"
                >
                  Sign In
                </button>
                <span className="text-white/40">•</span>
                <button
                  id="top-register-btn"
                  onClick={() => onNavigate('register')}
                  className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full text-white font-semibold transition cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Brand Logo */}
          <div
            id="brand-logo"
            onClick={() => onNavigate('home')}
            className="flex flex-col cursor-pointer select-none"
          >
            <span className="font-display text-2xl font-bold tracking-tight text-[#7A4B35]">
              Craftora
            </span>
            <span className="text-[10px] tracking-widest uppercase font-medium text-[#B77948] -mt-1">
              Handmade with Heart
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#29231F]/85">
            <button
              id="nav-link-home"
              onClick={() => onNavigate('home')}
              className={`hover:text-[#7A4B35] transition-colors cursor-pointer ${
                currentRoute === 'home' ? 'text-[#7A4B35] font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              id="nav-link-shop"
              onClick={() => onNavigate('shop')}
              className={`hover:text-[#7A4B35] transition-colors cursor-pointer ${
                currentRoute.startsWith('shop') ? 'text-[#7A4B35] font-semibold' : ''
              }`}
            >
              Shop
            </button>
            <button
              id="nav-link-categories"
              onClick={() => onNavigate('categories')}
              className={`hover:text-[#7A4B35] transition-colors cursor-pointer ${
                currentRoute === 'categories' ? 'text-[#7A4B35] font-semibold' : ''
              }`}
            >
              Categories
            </button>
            <button
              id="nav-link-artisans"
              onClick={() => onNavigate('artisans')}
              className={`hover:text-[#7A4B35] transition-colors cursor-pointer ${
                currentRoute.startsWith('artisan') ? 'text-[#7A4B35] font-semibold' : ''
              }`}
            >
              Artisans
            </button>
            <button
              id="nav-link-about"
              onClick={() => onNavigate('about')}
              className={`hover:text-[#7A4B35] transition-colors cursor-pointer ${
                currentRoute === 'about' ? 'text-[#7A4B35] font-semibold' : ''
              }`}
            >
              About Triad
            </button>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-xs relative">
            <input
              id="global-search-input"
              type="text"
              placeholder="Search handcrafted earrings, bags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-xs text-[#29231F] pl-9 pr-3 py-2 rounded-full border border-[#D9B99B]/50 focus:outline-none focus:border-[#7A4B35] transition shadow-2xs"
            />
            <Search size={15} className="absolute left-3 top-2.5 text-[#29231F]/50" />
          </form>

          {/* Action Icons */}
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            <button
              id="navbar-wishlist-btn"
              onClick={() => (user ? onNavigate('account') : onNavigate('login'))}
              aria-label="View Wishlist"
              className="relative p-2 text-[#29231F]/80 hover:text-[#7A4B35] hover:bg-white/70 rounded-full transition cursor-pointer"
            >
              <Heart size={20} />
              {wishlistIds.length > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#B77948] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Cart Drawer Trigger */}
            <button
              id="navbar-cart-btn"
              onClick={() => (onOpenCart ? onOpenCart() : setIsCartDrawerOpen(true))}
              aria-label="View Shopping Cart"
              className="relative p-2 text-[#29231F]/80 hover:text-[#7A4B35] hover:bg-white/70 rounded-full transition cursor-pointer"
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#7A4B35] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account / Genuine Auth Menu (Requirement 13) */}
            <div className="relative">
              {user ? (
                <button
                  id="user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1.5 pl-2 rounded-full bg-white border border-[#D9B99B]/40 hover:border-[#7A4B35] text-[#29231F] transition cursor-pointer"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-[#7A4B35] text-white flex items-center justify-center text-[10px] font-bold">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-semibold hidden sm:inline max-w-[100px] truncate">
                    {user.full_name.split(' ')[0]}
                  </span>
                  <ChevronDown size={13} className="text-[#29231F]/60" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    id="guest-signin-btn"
                    onClick={() => onNavigate('login')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#7A4B35] hover:bg-[#633B29] text-white transition shadow-sm cursor-pointer"
                  >
                    <LogIn size={13} />
                    <span>Sign In</span>
                  </button>
                  <button
                    id="guest-register-btn"
                    onClick={() => onNavigate('register')}
                    className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#FAF7F2] text-[#7A4B35] border border-[#D9B99B]/60 transition cursor-pointer"
                  >
                    <UserPlus size={13} />
                    <span>Register</span>
                  </button>
                </div>
              )}

              {/* Authenticated User Dropdown */}
              {user && userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#D9B99B]/35 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="text-xs font-bold text-[#29231F] truncate">{user.full_name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                    <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#7A4B35] border border-[#D9B99B]/40">
                      Role: {user.role}
                    </span>
                  </div>

                  {/* Customer Portal */}
                  <button
                    id="menu-my-orders-btn"
                    onClick={() => {
                      onNavigate('account');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#29231F] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                  >
                    <Package size={14} className="text-[#7A4B35]" /> My Orders & Profile
                  </button>

                  {/* Seller Portal */}
                  {(user.role === 'seller' || user.role === 'admin') && (
                    <button
                      id="menu-seller-portal-btn"
                      onClick={() => {
                        onNavigate('seller');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-[#7A4B35] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                    >
                      <Store size={14} /> Artisan Seller Portal
                    </button>
                  )}

                  {/* Management Portal */}
                  {(user.role === 'management' || user.role === 'admin') && (
                    <button
                      id="menu-management-btn"
                      onClick={() => {
                        onNavigate('management');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-blue-800 hover:bg-blue-50 flex items-center gap-2 cursor-pointer"
                    >
                      <BarChart3 size={14} /> Management Dashboard (MGT)
                    </button>
                  )}

                    {/* Admin Portal */}
                    {user.role === 'admin' && (
                      <button
                        id="menu-admin-btn"
                        onClick={() => {
                          onNavigate('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-50 flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck size={14} className="text-purple-700" /> Admin Control Panel
                      </button>
                    )}

                  <div className="border-t border-neutral-100 mt-1.5 pt-1.5">
                    <button
                      id="menu-logout-btn"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#29231F] cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#D9B99B]/30 bg-[#FAF7F2] px-4 pt-3 pb-6 flex flex-col gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search handcrafted..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-xs pl-9 pr-3 py-2 rounded-xl border border-[#D9B99B]/40"
            />
            <Search size={15} className="absolute left-3 top-2.5 text-neutral-400" />
          </form>

          {/* User Auth Section in Mobile Menu */}
          <div className="p-3 bg-white rounded-xl border border-[#D9B99B]/40">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#29231F]">{user.full_name}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#7A4B35]">
                    {user.role}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      onNavigate('account');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-xs py-1.5 text-[#7A4B35] font-medium"
                  >
                    My Account
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-right text-xs py-1.5 text-red-600 font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 text-center text-xs font-bold bg-[#7A4B35] text-white rounded-lg"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onNavigate('register');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 text-center text-xs font-bold bg-[#FAF7F2] text-[#7A4B35] border border-[#D9B99B]/50 rounded-lg"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="text-left text-sm font-medium py-1.5"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('shop');
              setMobileMenuOpen(false);
            }}
            className="text-left text-sm font-medium py-1.5"
          >
            Shop Collection
          </button>
          <button
            onClick={() => {
              onNavigate('categories');
              setMobileMenuOpen(false);
            }}
            className="text-left text-sm font-medium py-1.5"
          >
            Categories
          </button>
          <button
            onClick={() => {
              onNavigate('artisans');
              setMobileMenuOpen(false);
            }}
            className="text-left text-sm font-medium py-1.5"
          >
            Student & Local Artisans
          </button>
          <button
            onClick={() => {
              onNavigate('about');
              setMobileMenuOpen(false);
            }}
            className="text-left text-sm font-medium py-1.5"
          >
            About Triad Collaboration
          </button>

          {/* Role specific mobile shortcuts if logged in */}
          {user && (user.role === 'seller' || user.role === 'admin') && (
            <button
              onClick={() => {
                onNavigate('seller');
                setMobileMenuOpen(false);
              }}
              className="text-left text-sm font-medium py-1.5 text-[#7A4B35]"
            >
              Artisan Seller Studio
            </button>
          )}

          {user && (user.role === 'management' || user.role === 'admin') && (
            <button
              onClick={() => {
                onNavigate('management');
                setMobileMenuOpen(false);
              }}
              className="text-left text-sm font-medium py-1.5 text-blue-800"
            >
              Management Portal
            </button>
          )}

          {user && user.role === 'admin' && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="text-left text-sm font-medium py-1.5 text-purple-800"
            >
              Admin Controls
            </button>
          )}
        </div>
      )}
    </header>
  );
};
