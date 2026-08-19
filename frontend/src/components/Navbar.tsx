import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Sparkles, Network, Activity, Layers, ArrowUpRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PalimnLogo } from './PalimnLogo';
import { HealthBadge } from './HealthBadge';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/chat', label: 'Memory', icon: Sparkles },
    { to: '/graph', label: 'Graph', icon: Network },
    { to: '/benchmark', label: 'Benchmark', icon: Activity },
    { to: '/architecture', label: 'Architecture', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3.5 bg-[#07080D]/80 backdrop-blur-xl border-b border-white/[0.06] transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3">
          <PalimnLogo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-[#111522]/80 border border-white/[0.07] backdrop-blur-md shadow-inner" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-[#9AA4B2] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-cyan-400' : 'opacity-70'}`} />
                <span className="relative z-10">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Status Badge & CTA Button */}
        <div className="hidden lg:flex items-center gap-4">
          <HealthBadge />
          <Link
            to="/chat"
            className="group relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/90 to-blue-600/90 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-medium shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all duration-300 font-sans"
          >
            <span>Ask PALIMN</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-3">
          <HealthBadge />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-slate-800 bg-[#111522] text-slate-300 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pt-4 pb-2 border-t border-white/[0.06] mt-3"
          >
            <div className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                        : 'text-[#9AA4B2] hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-2">
                <Link
                  to="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-medium font-sans"
                >
                  <span>Ask PALIMN</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
