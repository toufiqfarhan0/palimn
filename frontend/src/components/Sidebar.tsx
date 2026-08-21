import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  GitMerge,
  Clock,
  Swords,
  Share2,
  Zap,
  DollarSign,
  BarChart3,
  Layers,
  Terminal,
  Activity,
  Github,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  to?: string;
  tabParam?: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab');

  const GROUPS: NavGroup[] = [
    {
      heading: 'INVESTIGATE',
      items: [
        {
          id: 'ask',
          label: 'Ask & Recall',
          to: '/chat',
          icon: MessageSquare,
        },
        {
          id: 'trace',
          label: 'Trace & Weave',
          to: '/',
          tabParam: 'weaver',
          icon: GitMerge,
        },
        {
          id: 'timeline',
          label: 'Timeline Replay',
          to: '/graph',
          icon: Clock,
        },
        {
          id: 'conflicts',
          label: 'Abstention Arena',
          to: '/',
          tabParam: 'arena',
          icon: Swords,
          badge: '0 Hallucinations',
        },
      ],
    },
    {
      heading: 'EXPLORE',
      items: [
        {
          id: 'graph_canvas',
          label: 'Graph Canvas',
          to: '/graph',
          icon: Share2,
        },
        {
          id: 'decay_engine',
          label: 'Decay Engine',
          to: '/',
          tabParam: 'decay',
          icon: Zap,
        },
        {
          id: 'cost_profiler',
          label: 'Cost ROI Profiler',
          to: '/',
          tabParam: 'cost',
          icon: DollarSign,
          badge: '-99.7%',
        },
      ],
    },
    {
      heading: 'LEARN',
      items: [
        {
          id: 'benchmark',
          label: 'Benchmark Hub',
          to: '/benchmark',
          icon: BarChart3,
          badge: '98.1%',
        },
        {
          id: 'architecture',
          label: 'How Palimn Works',
          to: '/architecture',
          icon: Layers,
        },
        {
          id: 'agent_sdk',
          label: 'Agent SDK Hub',
          to: '/',
          tabParam: 'sdk',
          icon: Terminal,
        },
      ],
    },
    {
      heading: 'SYSTEM',
      items: [
        {
          id: 'health',
          label: 'Graph Health',
          to: '/graph',
          icon: Activity,
        },
        {
          id: 'github',
          label: 'GitHub Repo',
          href: 'https://github.com/toufiqfarhan0/palimn',
          icon: Github,
        },
      ],
    },
  ];

  const handleItemClick = (item: NavItem) => {
    if (item.href) return;
    if (item.tabParam) {
      if (location.pathname === '/') {
        navigate(`/?tab=${item.tabParam}`);
        const el = document.getElementById('interactive-suite');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/?tab=${item.tabParam}`);
      }
    } else if (item.to) {
      navigate(item.to);
    }
    onClose();
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.href) return false;
    if (item.tabParam) {
      return location.pathname === '/' && currentTab === item.tabParam;
    }
    if (item.to === '/') {
      return location.pathname === '/' && !currentTab;
    }
    return location.pathname === item.to;
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-5 px-3 select-none">
      {/* ── Brand Header ────────────────────────────────────── */}
      <div className="px-3 pb-5 border-b border-white/[0.07]">
        <div
          onClick={() => { navigate('/'); onClose(); }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {/* Glowing Geometric Mark */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-mono font-black text-sm shadow-[0_0_16px_rgba(245,158,11,0.45)] border border-amber-300/50 flex-shrink-0 transition-transform group-hover:scale-105">
            Pλ
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-['Space_Grotesk',sans-serif] font-bold text-[15px] tracking-wide text-white group-hover:text-amber-300 transition-colors">
                  PALIMN
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
              </div>
              <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-blue-400 font-semibold truncate">
                Temporal Intelligence
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation Groups ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6 scrollbar-thin">
        {GROUPS.map((group) => (
          <div key={group.heading} className="space-y-1">
            {!collapsed && (
              <h4 className="px-3 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400 font-bold mb-1.5">
                {group.heading}
              </h4>
            )}
            {group.items.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;

              if (item.href) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!collapsed && <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 flex-shrink-0" />}
                  </a>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left group ${
                    active
                      ? 'bg-blue-600/15 text-blue-300 font-semibold border border-blue-500/30 shadow-[0_0_18px_rgba(59,130,246,0.15)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        active
                          ? 'text-blue-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                        active
                          ? 'bg-blue-500/25 text-blue-200'
                          : 'bg-white/[0.06] text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── System Status & Footer ──────────────────────────── */}
      <div className="pt-4 border-t border-white/[0.07] px-2 space-y-2">
        <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-[#0E1322] border border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-[11px] font-mono font-semibold text-slate-200 truncate">
                  HydraDB Cloud
                </div>
                <div className="text-[9px] font-mono text-emerald-400">Connected · Live</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              Track 3
            </span>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="w-full hidden lg:flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            <span>{collapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Fixed Sidebar ─────────────────────────────── */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 bottom-0 z-40 bg-[#07090E]/95 backdrop-blur-2xl border-r border-white/[0.08] transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Slide-out Drawer ───────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#07090E]/98 backdrop-blur-2xl border-r border-white/[0.1] shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
