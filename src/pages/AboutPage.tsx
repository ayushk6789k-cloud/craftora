import React from 'react';
import { Sparkles, Code2, Scissors, TrendingUp, Heart, ShieldCheck, ArrowRight } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (route: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A4B35]/10 text-[#7A4B35] text-xs font-semibold border border-[#7A4B35]/20">
          <Sparkles size={14} className="text-[#B77948]" />
          <span>The Academic Triad Behind Craftora</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#29231F] leading-tight">
          Where Engineering, Fashion, and Business Converge
        </h1>
        <p className="text-sm sm:text-base text-[#29231F]/80 leading-relaxed">
          Craftora is not a typical corporate drop-shipping portal. It is an interdisciplinary innovation project created to solve the commercial gap facing student accessories artisans and traditional heritage craftspersons.
        </p>
      </div>

      {/* The 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Pillar 1: Engineering ET */}
        <div className="bg-white rounded-3xl border border-[#D9B99B]/40 p-8 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Code2 size={28} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
              Department of Engineering (ET)
            </span>
            <h3 className="font-display text-xl font-bold text-[#29231F]">
              Technical Architecture & Reliability
            </h3>
            <p className="text-xs text-[#29231F]/75 leading-relaxed">
              Engineering ensures zero race conditions through atomic stock reservation, accurate currency representation in Indian paise (preventing IEEE 754 float drift), role-based JWT access controls, and cryptographic Razorpay signature verification.
            </p>
          </div>
          <div className="pt-4 border-t border-neutral-100 text-[11px] text-purple-900 font-semibold">
            Keywords: PostgreSQL, Atomic Transactions, Paired Webhooks, RBAC
          </div>
        </div>

        {/* Pillar 2: Fashion Design FD */}
        <div className="bg-white rounded-3xl border border-[#D9B99B]/40 p-8 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-[#7A4B35] flex items-center justify-center">
              <Scissors size={28} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A4B35]">
              Department of Fashion Design (FD)
            </span>
            <h3 className="font-display text-xl font-bold text-[#29231F]">
              Artisanal Curation & Material Ethics
            </h3>
            <p className="text-xs text-[#29231F]/75 leading-relaxed">
              Fashion Design students curate the accessories catalog, ensuring every piece celebrates slow fashion, uses non-toxic natural dyes, respects terracotta firing traditions, and honors textile techniques like hand-knotted macramé and brocade embroidery.
            </p>
          </div>
          <div className="pt-4 border-t border-neutral-100 text-[11px] text-[#7A4B35] font-semibold">
            Keywords: Slow Fashion, Natural Dyes, Terracotta, Artisan Verification
          </div>
        </div>

        {/* Pillar 3: Management Studies MGT */}
        <div className="bg-white rounded-3xl border border-[#D9B99B]/40 p-8 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TrendingUp size={28} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Department of Management (MGT)
            </span>
            <h3 className="font-display text-xl font-bold text-[#29231F]">
              Fair Trade Economics & Incubation
            </h3>
            <p className="text-xs text-[#29231F]/75 leading-relaxed">
              Management structures sustainable micro-enterprise unit economics. With a transparent 90% artisan payout model, student makers learn pricing strategy, cost-of-goods accounting, seasonal promo analytics, and customer retention without predatory platform gouging.
            </p>
          </div>
          <div className="pt-4 border-t border-neutral-100 text-[11px] text-emerald-900 font-semibold">
            Keywords: 90/10 Fair Split, GMV Reconciliation, Micro-Entrepreneurship
          </div>
        </div>
      </div>

      {/* Sustainable Craft Values Banner */}
      <div className="rounded-3xl bg-[#FAF7F2] border border-[#D9B99B]/40 p-8 sm:p-12 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#B77948]">
            Core Philosophy
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#29231F]">
            Handcrafted with Integrity in Indian Micro-Batches
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#29231F]/80">
          <div className="p-5 rounded-2xl bg-white border border-[#D9B99B]/30 space-y-2">
            <h4 className="font-bold text-sm text-[#7A4B35]">1. Zero Mass Production</h4>
            <p className="leading-relaxed">
              Every item is created by human hands in workshops and design studios. Minor variations in shade and hand-fired clay are cherished as marks of authenticity.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#D9B99B]/30 space-y-2">
            <h4 className="font-bold text-sm text-[#7A4B35]">2. Transparent 90/10 Split</h4>
            <p className="leading-relaxed">
              Unlike commercial portals that take 30–50% commission, Craftora disburses 90% of every rupee directly to the artisan creator, keeping 10% solely for platform operational costs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#D9B99B]/30 space-y-2">
            <h4 className="font-bold text-sm text-[#7A4B35]">3. Campus Certified</h4>
            <p className="leading-relaxed">
              Design students receive mentorship, material quality checks, and studio verification badges from the Fashion Design department lab.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap gap-4">
          <button
            onClick={() => onNavigate('shop')}
            className="bg-[#7A4B35] hover:bg-[#B77948] text-white px-6 py-3.5 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-2"
          >
            Explore the Handcrafted Catalog <ArrowRight size={15} />
          </button>
          <button
            onClick={() => onNavigate('artisans')}
            className="bg-white hover:bg-neutral-50 text-[#29231F] border border-[#D9B99B] px-6 py-3.5 rounded-2xl text-xs font-semibold transition cursor-pointer"
          >
            Meet the Student Makers
          </button>
        </div>
      </div>
    </div>
  );
};
