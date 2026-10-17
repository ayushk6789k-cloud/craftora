import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ArtisansPage } from './pages/ArtisansPage';
import { ArtisanStorefrontPage } from './pages/ArtisanStorefrontPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { AccountPage } from './pages/AccountPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { ManagementDashboardPage } from './pages/ManagementDashboardPage';
import { AdminPortalPage } from './pages/AdminPortalPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { Product } from './types';
import { ShieldAlert, Store, Lock, ArrowRight } from 'lucide-react';

function MainApp() {
  const { user, isLoading } = useAuth();

  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedArtisanId, setSelectedArtisanId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Checkout State
  const [checkoutCoupon, setCheckoutCoupon] = useState<string | undefined>();
  const [lastCompletedOrder, setLastCompletedOrder] = useState<{ id: string; orderNumber: string } | null>(null);

  // Detect recovery tokens or hash navigation on load
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('reset-password') || hash.includes('type=recovery')) {
        setCurrentRoute('reset-password');
      } else if (hash === '#login') {
        setCurrentRoute('login');
      } else if (hash === '#register') {
        setCurrentRoute('register');
      } else if (hash === '#forgot-password') {
        setCurrentRoute('forgot-password');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Scroll to top on navigation
  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    navigateTo('product-detail');
  };

  const handleSelectArtisan = (artisanId: string) => {
    setSelectedArtisanId(artisanId);
    navigateTo('artisan-detail');
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryFilter(catId);
    navigateTo('shop');
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    navigateTo('shop');
  };

  const handleProceedToCheckout = (coupon?: string) => {
    setCheckoutCoupon(coupon);
    setIsCartDrawerOpen(false);
    navigateTo('checkout');
  };

  const handleOrderSuccess = (orderId: string, orderNumber: string) => {
    setLastCompletedOrder({ id: orderId, orderNumber });
    navigateTo('order-success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#29231F] selection:bg-[#7A4B35]/20 selection:text-[#7A4B35]">
      {/* Top Navigation */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={(route) => {
          if (route === 'shop') {
            setSelectedCategoryFilter('');
            setSearchQuery('');
          }
          navigateTo(route);
        }}
        onOpenCart={() => setIsCartDrawerOpen(true)}
        onSearch={handleSearchSubmit}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentRoute === 'home' && (
          <HomePage
            onNavigate={navigateTo}
            onSelectProduct={handleSelectProduct}
            onSelectCategory={handleSelectCategory}
            onSelectArtisan={handleSelectArtisan}
          />
        )}

        {currentRoute === 'shop' && (
          <ShopPage
            initialCategory={selectedCategoryFilter}
            initialSearch={searchQuery}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentRoute === 'categories' && (
          <CategoriesPage onSelectCategory={handleSelectCategory} />
        )}

        {currentRoute === 'artisans' && (
          <ArtisansPage
            onSelectArtisan={handleSelectArtisan}
            onNavigate={navigateTo}
          />
        )}

        {currentRoute === 'artisan-detail' && selectedArtisanId && (
          <ArtisanStorefrontPage
            artisanId={selectedArtisanId}
            onBack={() => navigateTo('artisans')}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentRoute === 'product-detail' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            onBack={() => navigateTo('shop')}
            onSelectArtisan={handleSelectArtisan}
            onCheckoutDirect={() => navigateTo('checkout')}
          />
        )}

        {currentRoute === 'cart' && (
          <CartPage
            onProceedToCheckout={handleProceedToCheckout}
            onExplore={() => navigateTo('shop')}
          />
        )}

        {currentRoute === 'checkout' && (
          <CheckoutPage
            initialCoupon={checkoutCoupon}
            onBackToCart={() => navigateTo('cart')}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {currentRoute === 'order-success' && lastCompletedOrder && (
          <OrderSuccessPage
            orderId={lastCompletedOrder.id}
            orderNumber={lastCompletedOrder.orderNumber}
            onNavigateToAccount={() => navigateTo('account')}
            onContinueShopping={() => navigateTo('shop')}
          />
        )}

        {/* Customer Profile & Orders Portal */}
        {currentRoute === 'account' && (
          <AccountPage
            initialTab="orders"
            onExploreProducts={() => navigateTo('shop')}
            onNavigate={navigateTo}
          />
        )}

        {/* Genuine Auth Routes */}
        {currentRoute === 'login' && <LoginPage onNavigate={navigateTo} />}
        {currentRoute === 'register' && <RegisterPage onNavigate={navigateTo} />}
        {currentRoute === 'forgot-password' && <ForgotPasswordPage onNavigate={navigateTo} />}
        {currentRoute === 'reset-password' && <ResetPasswordPage onNavigate={navigateTo} />}

        {/* Protected Seller / Artisan Studio Portal */}
        {currentRoute === 'seller' && (
          <>
            {!user ? (
              <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#D9B99B]/50 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#D9B99B]/40 text-[#7A4B35] flex items-center justify-center mx-auto">
                  <Store size={26} />
                </div>
                <h2 className="font-display text-2xl font-bold text-[#29231F]">Artisan Studio Access</h2>
                <p className="text-xs text-[#29231F]/70">
                  Please sign in with your verified artisan seller account to manage your craft catalog, studio orders, and fulfillment.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => navigateTo('login')}
                    className="flex-1 py-2.5 bg-[#7A4B35] hover:bg-[#633B29] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigateTo('register')}
                    className="flex-1 py-2.5 bg-white border border-[#D9B99B]/60 text-[#7A4B35] text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Register as Artisan
                  </button>
                </div>
              </div>
            ) : user.role !== 'seller' && user.role !== 'admin' ? (
              <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-3xl border border-amber-200 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto">
                  <ShieldAlert size={26} />
                </div>
                <h2 className="font-display text-2xl font-bold text-[#29231F]">Artisan Studio Application Required</h2>
                <p className="text-xs text-[#29231F]/70 leading-relaxed">
                  You are signed in as <strong>{user.full_name}</strong> with <strong>Customer</strong> privileges. Artisan seller studios require verified approval from marketplace administration.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigateTo('account')}
                    className="px-5 py-2.5 bg-[#7A4B35] hover:bg-[#633B29] text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Submit Artisan Application in Account</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => navigateTo('shop')}
                    className="px-5 py-2.5 bg-white border border-[#D9B99B]/60 text-[#29231F] text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Browse Marketplace
                  </button>
                </div>
              </div>
            ) : (
              <SellerDashboardPage />
            )}
          </>
        )}

        {/* Protected Management (MGT) Portal */}
        {currentRoute === 'management' && (
          <>
            {!user ? (
              <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#D9B99B]/50 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center mx-auto">
                  <Lock size={26} />
                </div>
                <h2 className="font-display text-2xl font-bold text-[#29231F]">Management Portal</h2>
                <p className="text-xs text-[#29231F]/70">
                  Authentication required. Please sign in with management lead credentials to review marketplace operational metrics.
                </p>
                <button
                  onClick={() => navigateTo('login')}
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Sign In to Management Portal
                </button>
              </div>
            ) : user.role !== 'management' && user.role !== 'admin' ? (
              <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
                  <ShieldAlert size={26} />
                </div>
                <h2 className="font-display text-2xl font-bold text-rose-950">Access Restricted</h2>
                <p className="text-xs text-rose-800/90 leading-relaxed">
                  This portal is reserved for Management (MGT) department leads. Your current role is <strong>{user.role}</strong>.
                </p>
                <button
                  onClick={() => navigateTo('home')}
                  className="px-5 py-2.5 bg-[#FAF7F2] border border-[#D9B99B]/60 text-[#29231F] text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <ManagementDashboardPage />
            )}
          </>
        )}

        {/* Protected System Admin (ET) Portal */}
        {currentRoute === 'admin' && (
          <>
            {!user ? (
              <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#D9B99B]/50 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center justify-center mx-auto">
                  <Lock size={26} />
                </div>
                <h2 className="font-display text-2xl font-bold text-[#29231F]">System Admin Access</h2>
                <p className="text-xs text-[#29231F]/70">
                  Administrator sign-in required to access system settings, artisan approvals, and role management.
                </p>
                <button
                  onClick={() => navigateTo('login')}
                  className="w-full py-2.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Sign In as Administrator
                </button>
              </div>
            ) : user.role !== 'admin' ? (
              <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
                  <ShieldAlert size={26} />
                </div>
                <h2 className="font-display text-2xl font-bold text-rose-950">Administrator Access Restricted</h2>
                <p className="text-xs text-rose-800/90 leading-relaxed">
                  Engineering & Tech (ET) administration portal requires verified <strong>Admin</strong> privileges.
                </p>
                <button
                  onClick={() => navigateTo('home')}
                  className="px-5 py-2.5 bg-[#FAF7F2] border border-[#D9B99B]/60 text-[#29231F] text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <AdminPortalPage />
            )}
          </>
        )}

        {currentRoute === 'about' && <AboutPage onNavigate={navigateTo} />}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onProceedToCheckout={() => {
          setIsCartDrawerOpen(false);
          navigateTo('checkout');
        }}
        onViewCartPage={() => {
          setIsCartDrawerOpen(false);
          navigateTo('cart');
        }}
      />

      {/* Global Craftora Footer */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <MainApp />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
