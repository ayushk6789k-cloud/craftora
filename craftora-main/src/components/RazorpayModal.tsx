import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, CreditCard, Smartphone, Building2, Lock, X, AlertTriangle } from 'lucide-react';
import { formatPaise } from '../types';

interface RazorpayModalProps {
  isOpen: boolean;
  orderId: string;
  orderNumber: string;
  amount: number; // in paise
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  isDemo?: boolean;
  paymentMode?: 'demo' | 'razorpay';
  razorpayOrderId?: string;
  onSuccess: (paymentDetails: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    is_demo_simulation?: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  orderId,
  orderNumber,
  amount,
  customerName,
  customerEmail = 'customer@craftora.com',
  customerPhone = '+91 98765 43210',
  isDemo = true,
  paymentMode = 'demo',
  razorpayOrderId,
  onSuccess,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateSuccess = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const mockPaymentId = isDemo
        ? `demo_pay_${Math.random().toString(36).substring(2, 12)}`
        : `pay_${Math.random().toString(36).substring(2, 12)}`;
      const mockOrderId =
        razorpayOrderId ||
        (isDemo
          ? `demo_order_${orderId.replace(/-/g, '').substring(0, 14)}`
          : `order_test_${orderId.replace(/-/g, '').substring(0, 14)}`);

      await onSuccess({
        razorpay_order_id: mockOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: isDemo ? 'mock_demo_signature' : 'mock_test_signature',
        is_demo_simulation: isDemo,
      });
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
      setIsProcessing(false);
    }
  };

  const handleSimulateFailure = () => {
    setError('Payment was simulated as declined/cancelled by user or bank.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200 flex flex-col">
        {/* Brand Header */}
        <div className={`text-white px-6 py-4 flex items-center justify-between ${isDemo ? 'bg-[#1C2833]' : 'bg-[#0C2340]'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-base ${isDemo ? 'bg-amber-600' : 'bg-[#3395FF]'}`}>
              {isDemo ? 'D' : 'R'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-wide">
                  {isDemo ? 'Craftora Demo Payment' : 'Razorpay Gateway'}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDemo ? 'bg-amber-400 text-neutral-900' : 'bg-emerald-400 text-neutral-900'}`}>
                  {isDemo ? 'DEMO MODE' : 'TEST MODE'}
                </span>
              </div>
              <p className="text-[11px] text-white/70">Craftora Handcrafted Marketplace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Academic Project Notice Banner */}
        {isDemo && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-start gap-2 text-[11px] text-amber-900">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Academic College Project Demonstration</p>
              <p className="text-amber-800 text-[10.5px]">
                Simulated sandbox transaction. Zero real money or real bank accounts are involved. Never connects to live payment servers.
              </p>
            </div>
          </div>
        )}

        {/* Order Amount Bar */}
        <div className="bg-[#F4F7FB] px-6 py-3.5 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-500 font-medium">Order: {orderNumber}</p>
            <p className="text-xs font-semibold text-neutral-800">{customerName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-neutral-500 uppercase font-semibold">Amount to Pay</p>
            <p className="text-lg font-bold text-[#0C2340]">{formatPaise(amount)}</p>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('upi')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'upi'
                ? 'border-b-2 border-amber-600 text-neutral-900 bg-white'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Smartphone size={14} /> UPI / QR
          </button>
          <button
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'card'
                ? 'border-b-2 border-amber-600 text-neutral-900 bg-white'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <CreditCard size={14} /> Cards
          </button>
          <button
            onClick={() => setActiveTab('netbanking')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'netbanking'
                ? 'border-b-2 border-amber-600 text-neutral-900 bg-white'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Building2 size={14} /> Netbanking
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <XCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'upi' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-800">Demo UPI: Google Pay / PhonePe / Paytm</p>
                  <p className="text-[11px] text-neutral-500">{customerPhone}@demo-upi</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  READY
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 text-center">
                Simulates instant UPI Collect and webhook callbacks for order fulfillment.
              </p>
            </div>
          )}

          {activeTab === 'card' && (
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-neutral-700">•••• •••• •••• 4242</span>
                  <span className="font-semibold text-neutral-600">Simulated Visa Card</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-neutral-500">
                  <span>Exp: 12/28</span>
                  <span>CVV: 999</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'netbanking' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-center font-medium">
                State Bank of India (Demo)
              </div>
              <div className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-center font-medium">
                HDFC Bank (Demo)
              </div>
              <div className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-center font-medium">
                ICICI Bank (Demo)
              </div>
              <div className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-center font-medium">
                Axis Bank (Demo)
              </div>
            </div>
          )}

          {/* Academic Simulation Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              id="payment-simulate-success-btn"
              onClick={handleSimulateSuccess}
              disabled={isProcessing}
              className={`w-full text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50 ${
                isDemo ? 'bg-amber-700 hover:bg-amber-800' : 'bg-[#0C2340] hover:bg-[#1A365D]'
              }`}
            >
              {isProcessing ? (
                <span>Confirming Sandbox Transaction...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>
                    {isDemo
                      ? `Complete Demo Payment (${formatPaise(amount)})`
                      : `Complete Test Payment (${formatPaise(amount)})`}
                  </span>
                </>
              )}
            </button>

            <button
              id="payment-simulate-fail-btn"
              onClick={handleSimulateFailure}
              disabled={isProcessing}
              className="w-full bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-300 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Simulate Cancelled / Failed Payment
            </button>
          </div>
        </div>

        {/* Security / Academic Footer */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
          <Lock size={12} className="text-neutral-400" />
          <span>
            {isDemo
              ? 'Academic Project Sandbox • Zero Real Financial Transaction'
              : 'Secured by 256-bit TLS Encryption • PCI-DSS Level 1 Compliant'}
          </span>
        </div>
      </div>
    </div>
  );
};
