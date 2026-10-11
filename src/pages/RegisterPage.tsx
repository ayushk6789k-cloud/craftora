import React, { useState } from 'react';
import { z } from 'zod';
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  Store,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterPageProps {
  onNavigate: (route: string) => void;
}

// Zod Schema Validation (Requirement 4)
const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters.')
      .max(150, 'Full name cannot exceed 150 characters.'),
    email: z.string().trim().email('Please enter a valid email address.'),
    phone: z.string().trim().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[0-9]/, 'Password must contain at least one number.')
      .regex(/[A-Z]|[^A-Za-z0-9]/, 'Password must contain at least one uppercase letter or special symbol.'),
    confirmPassword: z.string(),
    accountType: z.enum(['customer', 'seller']),
    storeName: z.string().trim().optional(),
    craftType: z.string().trim().optional(),
    bio: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register, isConfigured } = useAuth();

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'customer' | 'seller'>('customer');

  // Artisan Application specific fields
  const [storeName, setStoreName] = useState('');
  const [craftType, setCraftType] = useState('Terracotta & Ceramics');
  const [bio, setBio] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setGlobalError(null);
    setConfirmationNotice(null);

    // 1. Zod Validation
    const validationResult = registerSchema.safeParse({
      fullName,
      email,
      phone: phone || undefined,
      password,
      confirmPassword,
      accountType,
      storeName: accountType === 'seller' ? storeName : undefined,
      craftType: accountType === 'seller' ? craftType : undefined,
      bio: accountType === 'seller' ? bio : undefined,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    // 2. Genuine Supabase Registration
    const res = await register({
      email,
      password,
      full_name: fullName,
      phone,
      account_type: accountType,
      store_name: storeName || `${fullName}'s Studio`,
      craft_type: craftType,
      bio: bio || 'Independent college artisan applicant.',
    });

    setSubmitting(false);

    if (res.success) {
      if (res.emailConfirmationRequired) {
        setConfirmationNotice(
          res.message ||
            `A verification link was dispatched to ${email}. Please confirm your email address in your inbox before signing in.`
        );
      } else {
        // Immediate session created!
        onNavigate('account');
      }
    } else {
      setGlobalError(res.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-lg space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-[#D9B99B]/50 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#D9B99B]/40 text-[#7A4B35] mb-1">
            <Sparkles size={26} />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#29231F] tracking-tight">
            Create Your Account
          </h1>
          <p className="text-sm text-[#29231F]/70">
            Join Craftora's collegiate handcrafted accessories community
          </p>
        </div>

        {/* Supabase Notice */}
        {!isConfigured && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Supabase Credentials Notice</p>
              <p className="text-amber-800/90 leading-relaxed">
                Authentication requires <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code>.
              </p>
            </div>
          </div>
        )}

        {/* Email Confirmation Notice (Requirement 16) */}
        {confirmationNotice && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Email Confirmation Required</p>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">{confirmationNotice}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Proceed to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Global Error Alert */}
        {globalError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 animate-in fade-in">
            <AlertCircle size={18} className="text-rose-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Registration Error</p>
              <p className="text-rose-800/90">{globalError}</p>
            </div>
          </div>
        )}

        {!confirmationNotice && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Type Selector (Requirement 4 & 9) */}
            <div>
              <label className="block text-xs font-semibold text-[#29231F] uppercase tracking-wider mb-2">
                I am joining as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('customer')}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                    accountType === 'customer'
                      ? 'border-[#7A4B35] bg-[#FAF7F2] ring-2 ring-[#7A4B35]/20'
                      : 'border-[#D9B99B]/50 hover:bg-[#FAF7F2]/40 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-[#29231F]">
                    <ShoppingBag size={16} className="text-[#7A4B35]" />
                    <span>Conscious Buyer</span>
                  </div>
                  <p className="text-[11px] text-[#29231F]/60">
                    Discover & purchase unique college artisan accessories
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType('seller')}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                    accountType === 'seller'
                      ? 'border-[#7A4B35] bg-[#FAF7F2] ring-2 ring-[#7A4B35]/20'
                      : 'border-[#D9B99B]/50 hover:bg-[#FAF7F2]/40 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-[#7A4B35]">
                    <Store size={16} />
                    <span>Artisan Maker</span>
                  </div>
                  <p className="text-[11px] text-[#29231F]/60">
                    Showcase handcrafted crafts & apply for seller studio
                  </p>
                </button>
              </div>
              <p className="text-[11px] text-[#29231F]/50 mt-1.5 italic">
                {accountType === 'seller'
                  ? 'Note: Artisan accounts receive customer privileges initially and enter pending review for administrator approval.'
                  : 'Standard customer privileges to place orders, write verified reviews, and track shipments.'}
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-[#29231F] uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#29231F]/40">
                  <User size={18} />
                </div>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Priya Patel"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2]/60 border border-[#D9B99B]/60 rounded-xl text-sm text-[#29231F] placeholder:text-[#29231F]/40 focus:outline-none focus:ring-2 focus:ring-[#7A4B35]/20 focus:border-[#7A4B35] transition"
                />
              </div>
              {validationErrors.fullName && (
                <p className="text-[11px] text-rose-600 mt-1">{validationErrors.fullName}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-[#29231F] uppercase tracking-wider mb-1.5">
                Email Address <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#29231F]/40">
                  <Mail size={18} />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya.patel@craftora.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2]/60 border border-[#D9B99B]/60 rounded-xl text-sm text-[#29231F] placeholder:text-[#29231F]/40 focus:outline-none focus:ring-2 focus:ring-[#7A4B35]/20 focus:border-[#7A4B35] transition"
                />
              </div>
              {validationErrors.email && (
                <p className="text-[11px] text-rose-600 mt-1">{validationErrors.email}</p>
              )}
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-[#29231F] uppercase tracking-wider mb-1.5">
                Phone Number <span className="text-[10px] text-[#29231F]/50 lowercase">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#29231F]/40">
                  <Phone size={18} />
                </div>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2]/60 border border-[#D9B99B]/60 rounded-xl text-sm text-[#29231F] placeholder:text-[#29231F]/40 focus:outline-none focus:ring-2 focus:ring-[#7A4B35]/20 focus:border-[#7A4B35] transition"
                />
              </div>
            </div>

            {/* Artisan Maker Optional Application Fields */}
            {accountType === 'seller' && (
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D9B99B]/60 space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7A4B35] uppercase tracking-wider">
                  <Store size={15} />
                  <span>Artisan Studio Details</span>
                </div>

                <div>
                  <label htmlFor="reg-store-name" className="block text-xs font-semibold text-[#29231F] mb-1">
                    Studio / Store Name
                  </label>
                  <input
                    id="reg-store-name"
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Clay & Petals Studio"
                    className="w-full px-3 py-2 bg-white border border-[#D9B99B]/60 rounded-xl text-xs text-[#29231F] focus:outline-none focus:border-[#7A4B35]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-craft-type" className="block text-xs font-semibold text-[#29231F] mb-1">
                      Primary Craft
                    </label>
                    <select
                      id="reg-craft-type"
                      value={craftType}
                      onChange={(e) => setCraftType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D9B99B]/60 rounded-xl text-xs text-[#29231F] focus:outline-none focus:border-[#7A4B35]"
                    >
                      <option value="Terracotta & Ceramics">Terracotta & Ceramics</option>
                      <option value="Handmade Jewelry">Handmade Jewelry</option>
                      <option value="Woven & Macrame Bags">Woven & Macrame Bags</option>
                      <option value="Lost-wax Bell Metal">Lost-wax Bell Metal</option>
                      <option value="Hand-painted Accessories">Hand-painted Accessories</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reg-bio" className="block text-xs font-semibold text-[#29231F] mb-1">
                      Brief Craft Description
                    </label>
                    <input
                      id="reg-bio"
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g. Handcrafted botanical polymer jewelry."
                      className="w-full px-3 py-2 bg-white border border-[#D9B99B]/60 rounded-xl text-xs text-[#29231F] focus:outline-none focus:border-[#7A4B35]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-[#29231F] uppercase tracking-wider mb-1.5">
                Password <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#29231F]/40">
                  <Lock size={18} />
                </div>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 number, 1 uppercase"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#FAF7F2]/60 border border-[#D9B99B]/60 rounded-xl text-sm text-[#29231F] placeholder:text-[#29231F]/40 focus:outline-none focus:ring-2 focus:ring-[#7A4B35]/20 focus:border-[#7A4B35] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#29231F]/50 hover:text-[#29231F] transition cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-[11px] text-rose-600 mt-1">{validationErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-[#29231F] uppercase tracking-wider mb-1.5">
                Confirm Password <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#29231F]/40">
                  <ShieldCheck size={18} />
                </div>
                <input
                  id="reg-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2]/60 border border-[#D9B99B]/60 rounded-xl text-sm text-[#29231F] placeholder:text-[#29231F]/40 focus:outline-none focus:ring-2 focus:ring-[#7A4B35]/20 focus:border-[#7A4B35] transition"
                />
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-[11px] text-rose-600 mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#7A4B35] hover:bg-[#633B29] text-white font-medium text-sm shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-[#D9B99B]/30 text-center space-y-2">
          <p className="text-xs text-[#29231F]/70">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="font-semibold text-[#7A4B35] hover:text-[#B77948] transition cursor-pointer"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
