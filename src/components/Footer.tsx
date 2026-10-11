import React from 'react';
import { ShieldCheck, Heart, Sparkles, Cpu, Palette, TrendingUp } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#29231F] text-[#FAF7F2] pt-14 pb-8 border-t border-[#7A4B35]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Triad Department Badges Bar */}
        <div className="bg-[#382F2A] rounded-2xl p-6 mb-12 border border-[#D9B99B]/20">
          <div className="text-center mb-6">
            <span className="text-xs font-semibold text-[#D9B99B] uppercase tracking-widest">
              Interdisciplinary Academic Initiative
            </span>
            <h3 className="font-display text-xl font-bold text-white mt-1">
              Crafted Across Three Pillars of Excellence
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ET */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="p-2.5 rounded-lg bg-purple-900/50 text-purple-300">
                <Cpu size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Engineering & Tech (ET)
                </h4>
                <p className="text-[11px] text-white/70 mt-1">
                  Full-stack architecture, atomic inventory reservations, role-based security & Razorpay payment verification.
                </p>
              </div>
            </div>

            {/* FD */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="p-2.5 rounded-lg bg-amber-900/50 text-amber-300">
                <Palette size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Fashion Design (FD)
                </h4>
                <p className="text-[11px] text-white/70 mt-1">
                  Artisanal accessories curation, material specifications, care guides, and slow craft storytelling.
                </p>
              </div>
            </div>

            {/* MGT */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="p-2.5 rounded-lg bg-blue-900/50 text-blue-300">
                <TrendingUp size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Management (MGT)
                </h4>
                <p className="text-[11px] text-white/70 mt-1">
                  Marketplace unit economics, contribution margins, vendor commission payouts & promotional campaign engines.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex flex-col select-none">
              <span className="font-display text-2xl font-bold tracking-tight text-[#D9B99B]">
                Craftora
              </span>
              <span className="text-[10px] tracking-widest uppercase font-medium text-white/60">
                Handmade with Heart
              </span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Empowering student and regional artisans by connecting thoughtful buyers with authentic, slow-crafted accessories.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-[#D9B99B]">
              <ShieldCheck size={16} />
              <span>Razorpay Verified Gateway</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D9B99B] mb-3">
              Marketplace
            </h4>
            <ul className="space-y-2 text-xs text-white/75">
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="hover:text-white transition cursor-pointer"
                >
                  All Handcrafted Accessories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Explore Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('artisans')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Meet Our Student Artisans
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Interdisciplinary Collaboration
                </button>
              </li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D9B99B] mb-3">
              Academic Portals
            </h4>
            <ul className="space-y-2 text-xs text-white/75">
              <li>
                <button
                  onClick={() => onNavigate('seller')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Artisan Seller Studio (FD)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('management')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Management & Analytics (MGT)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Platform & Security Admin (ET)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('account')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Customer Account & Orders
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter / Campus Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D9B99B] mb-3">
              Campus Artisans Club
            </h4>
            <p className="text-xs text-white/70 mb-3">
              Get notified when student creators drop limited-batch accessories and seasonal campus showcases.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter college email..."
                className="bg-[#382F2A] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D9B99B] flex-1"
              />
              <button
                onClick={() => alert('Thank you for subscribing to Craftora Campus Drops!')}
                className="bg-[#7A4B35] hover:bg-[#B77948] text-white px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© 2026 Craftora Marketplace. Developed for Academic Project Collaboration.</p>
          <div className="flex items-center gap-1">
            <span>Built with passion & craft</span>
            <Heart size={12} className="text-red-400 fill-red-400" />
            <span>by Engineering, Fashion Design & Management Students</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
