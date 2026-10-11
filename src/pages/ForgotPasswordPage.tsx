import React, { useState } from 'react';
import { Mail, KeyRound, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ForgotPasswordPageProps {
  onNavigate: (route: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { resetPassword, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter the email address registered with your account.');
      return;
    }

    setSubmitting(true);
    const res = await resetPassword(email);
    setSubmitting(false);

    if (res.success) {
      setSuccessMessage(
        res.message ||
          `A password reset link has been dispatched to ${email}. Please check your inbox and click the link to configure a new password.`
      );
    } else {
      setErrorMessage(res.error || 'Failed to dispatch password reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-[#D9B99B]/50 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#D9B99B]/40 text-[#7A4B35] mb-1">
            <KeyRound size={26} />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#29231F] tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-[#29231F]/70">
            Enter your email and we'll send you recovery instructions
          </p>
        </div>

        {/* Supabase Notice */}
        {!isConfigured && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Supabase Setup Required</p>
              <p className="text-amber-800/90 leading-relaxed">
                Password recovery requires active Supabase Authentication configured with Site URL and redirect permissions.
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Email Dispatched</p>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">{successMessage}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 animate-in fade-in">
            <AlertCircle size={18} className="text-rose-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Reset Request Failed</p>
              <p className="text-rose-800/90">{errorMessage}</p>
            </div>
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-semibold text-[#29231F] uppercase tracking-wider mb-2">
                Your Account Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#29231F]/40">
                  <Mail size={18} />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artisan@craftora.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2]/60 border border-[#D9B99B]/60 rounded-xl text-sm text-[#29231F] placeholder:text-[#29231F]/40 focus:outline-none focus:ring-2 focus:ring-[#7A4B35]/20 focus:border-[#7A4B35] transition"
                />
              </div>
            </div>

            <button
              id="forgot-password-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-[#7A4B35] hover:bg-[#633B29] text-white font-medium text-sm shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dispatching Email...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Instructions</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="pt-4 border-t border-[#D9B99B]/30 text-center">
          <button
            onClick={() => onNavigate('login')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A4B35] hover:text-[#B77948] transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
