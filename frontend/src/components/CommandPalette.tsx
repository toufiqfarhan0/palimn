import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  Clock, 
  Network, 
  Activity, 
  Layers, 
  CornerDownLeft, 
  X,
  Zap,
  ShieldCheck
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: 'Queries' | 'Navigation' | 'Presets';
  title: string;
  subtitle: string;
  icon: any;
  action: () => void;
  badge?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const COMMANDS: CommandItem[] = [
    {
      id: 'query-active-loc',
      category: 'Queries',
      title: 'Where do I live now?',
      subtitle: 'Active state query (Hyderabad)',
      icon: Sparkles,
      badge: 'Active Fact',
      action: () => {
        navigate('/chat');
        onClose();
      },
    },
    {
      id: 'query-historical-loc',
      category: 'Queries',
      title: 'Where did I live before Hyderabad?',
      subtitle: 'SUPERSEDES backward traversal (Bangalore)',
      icon: Clock,
      badge: 'Lineage Walk',
      action: () => {
        navigate('/chat');
        onClose();
      },
    },
    {
      id: 'query-degree',
      category: 'Queries',
      title: 'What degree did I graduate with?',
      subtitle: 'Multi-session factual recall',
      icon: Zap,
      badge: 'Session 51',
      action: () => {
        navigate('/chat');
        onClose();
      },
    },
    {
      id: 'query-abstain',
      category: 'Queries',
      title: 'What spaceship do I own?',
      subtitle: 'Calibrated abstention (Zero hallucination)',
      icon: ShieldCheck,
      badge: 'Abstain',
      action: () => {
        navigate('/chat');
        onClose();
      },
    },
    {
      id: 'nav-graph',
      category: 'Navigation',
      title: 'Open Graph Inspector',
      subtitle: 'Explore temporal nodes & SUPERSEDES edges in React Flow',
      icon: Network,
      badge: 'Visualizer',
      action: () => {
        navigate('/graph');
        onClose();
      },
    },
    {
      id: 'nav-benchmark',
      category: 'Navigation',
      title: 'Open LongMemEval_S Benchmark',
      subtitle: 'View 500-question metrics, recall@20 & live single-question runner',
      icon: Activity,
      badge: '96.60% Recall',
      action: () => {
        navigate('/benchmark');
        onClose();
      },
    },
    {
      id: 'nav-architecture',
      category: 'Navigation',
      title: 'Open 5-Stage Architecture Guide',
      subtitle: 'Deep-dive into deterministic temporal pipeline',
      icon: Layers,
      badge: 'Docs',
      action: () => {
        navigate('/architecture');
        onClose();
      },
    },
  ];

  const filteredCommands = COMMANDS.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Command Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl rounded-2xl bg-[#0C101C]/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(56,189,248,0.25)] backdrop-blur-2xl overflow-hidden z-10 flex flex-col font-sans"
        >
          {/* Top Search Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] gap-3">
            <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search temporal memories, preset questions, or pages..."
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white/[0.05] border border-white/[0.08] rounded">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredCommands.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-slate-500">
                No matching memory commands or pages found.
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/50 to-indigo-950/40 border border-cyan-400/40 text-white shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/[0.04] text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium truncate">{cmd.title}</span>
                          {cmd.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-cyan-300 border border-white/[0.06]">
                              {cmd.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate font-mono">{cmd.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-3 flex-shrink-0">
                      {isSelected && (
                        <span className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                          <span>Select</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2.5 bg-[#080B14] border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">↓</kbd>
                <span>to navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">↵</kbd>
                <span>to execute</span>
              </span>
            </div>
            <span className="text-cyan-400/80">HydraDB Cloud Native</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
