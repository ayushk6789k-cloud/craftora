import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ResetPasswordPageProps {
  onNavigate: (route: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const { updatePassword, session } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setErrorMessage('Password must include at least one numeric digit.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const res = await updatePassword(newPassword);
    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setErrorMessage(
        res.error ||
          'Failed to update password. Your recovery link may have expired. Please request a new link.'
      );
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-[#D9B99B]/50 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#D9B99B]/40 text-[#7A4B35] mb-1">
            <Lock size={26} />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#29231F] tracking-tight">
            Create New Password
          </h1>
          <p className="text-sm text-[#29231F]/70">
            Enter your new secure password for your Craftora account
          </p>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm space-y-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Password Updated Successfully</p>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Your password has been securely updated. You can now use your new credentials across Craftora.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('account')}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue to My Account</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 animate-in fade-in">
                <AlertCircle size={18} className="text-rose-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold mb-0.5">Update Failed</p>
                  <p className="text-rose-800/90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="reset-new-password" className="block text-xs font-semibold text-[#29231F] uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#29231F]/40">
                  <Lock size={18} />
                </div>
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 number"
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

            {/* Confirm New Password */}
            <div>
              <label htmlFor="reset-confirm-password" className="block text-xs font-semibold text-[#29231F] uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#29231F]/40">
                  <Lock size={18} />
                </div>
                <input
                  id="reset-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2]/60 border border-[#D9B99B]/60 rounded-xl text-sm text-[#29231F] placeholder:text-[#29231F]/40 focus:outline-none focus:ring-2 focus:ring-[#7A4B35]/20 focus:border-[#7A4B35] transition"
                />
              </div>
            </div>

            <button
              id="reset-password-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-[#7A4B35] hover:bg-[#633B29] text-white font-medium text-sm shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
