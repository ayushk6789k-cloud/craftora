import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onNavigate: (route: string) => void;
  returnRoute?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, returnRoute = 'account' }) => {
  const { login, resendVerificationEmail, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsUnconfirmed(false);
    setResendStatus(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      onNavigate(returnRoute);
    } else {
      if (res.emailConfirmationRequired) {
        setIsUnconfirmed(true);
        setErrorMessage(
          'Your email address has not been verified yet. Please check your inbox and click the verification link to confirm your account before logging in.'
        );
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address to receive a new verification link.');
      return;
    }
    setResending(true);
    setResendStatus(null);
    const res = await resendVerificationEmail(email);
    setResending(false);
    if (res.success) {
      setResendStatus(res.message || 'A new verification link has been sent to your email.');
    } else {
      setErrorMessage(res.error || 'Failed to resend verification email.');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-[#D9B99B]/50 shadow-sm">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#D9B99B]/40 text-[#7A4B35] mb-1">
            <Lock size={26} />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#29231F] tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-[#29231F]/70">
            Sign in to your Craftora artisan marketplace account
          </p>
        </div>

        {/* Supabase Unconfigured Notice (Requirement 19) */}
        {!isConfigured && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Supabase Credentials Required</p>
              <p className="leading-relaxed text-amber-800/90">
                To sign in with live accounts, configure <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> and <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code> in your environment settings.
              </p>
            </div>
          </div>
        )}

        {/* Unconfirmed Email Alert with Verification Instructions (Requirement 9) */}
        {isUnconfirmed && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-900 text-sm">Email Verification Required</p>
                <p className="leading-relaxed text-amber-900/90">
                  Supabase requires you to confirm your email before signing in. Please check your inbox (and spam/junk folder) for the verification email sent during registration and click the link.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between">
              <span className="text-[11px] text-amber-800">Didn't receive the email?</span>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="font-semibold text-xs text-[#7A4B35] hover:text-[#633B29] underline cursor-pointer disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          </div>
        )}

        {/* Resend Confirmation Success */}
        {resendStatus && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
            <p className="leading-tight">{resendStatus}</p>
          </div>
        )}

        {/* Generic Error Alert */}
        {errorMessage && !isUnconfirmed && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-900 text-xs flex items-start gap-3 animate-in fade-in">
            <AlertCircle size={18} className="text-rose-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Unable to Sign In</p>
              <p className="leading-relaxed text-rose-800/90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-[#29231F] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#29231F]/40">
                <Mail size={18} />
              </div>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="artisan@craftora.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2]/60 border border-[#D9B99B]/60 rounded-xl text-sm text-[#29231F] placeholder:text-[#29231F]/40 focus:outline-none focus:ring-2 focus:ring-[#7A4B35]/20 focus:border-[#7A4B35] transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="login-password" className="block text-xs font-semibold text-[#29231F] uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-xs font-medium text-[#7A4B35] hover:text-[#B77948] transition cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#29231F]/40">
                <Lock size={18} />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#7A4B35] hover:bg-[#633B29] text-white font-medium text-sm shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-[#D9B99B]/30 text-center space-y-3">
          <p className="text-xs text-[#29231F]/70">
            Don't have an account yet?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="font-semibold text-[#7A4B35] hover:text-[#B77948] transition cursor-pointer"
            >
              Create an Account
            </button>
          </p>
          <div className="text-[11px] text-[#29231F]/50">
            Craftora Marketplace • Protected by genuine Supabase Authentication & PostgreSQL RLS
          </div>
        </div>
      </div>
    </div>
  );
};
