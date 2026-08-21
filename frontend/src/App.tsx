import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CommandPalette } from './components/CommandPalette';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { GraphPage } from './pages/GraphPage';
import { BenchmarkPage } from './pages/BenchmarkPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { NotFoundPage } from './pages/NotFoundPage';

export const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global CMD+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ── Left Sidebar (Categorized like Veridex) ─────────────── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* ── Main Content Area ───────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar Header */}
        <Navbar
          onToggleSidebar={() => {
            // On desktop toggles collapse, on mobile toggles drawer
            if (window.innerWidth >= 1024) {
              setSidebarCollapsed((prev) => !prev);
            } else {
              setSidebarOpen((prev) => !prev);
            }
          }}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1">
          <Routes>
            <Route path="/"             element={<HomePage />} />
            <Route path="/chat"         element={<ChatPage />} />
            <Route path="/graph"        element={<GraphPage />} />
            <Route path="/benchmark"    element={<BenchmarkPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="*"             element={<NotFoundPage />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
