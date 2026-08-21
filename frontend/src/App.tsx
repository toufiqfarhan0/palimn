import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { GraphPage } from './pages/GraphPage';
import { BenchmarkPage } from './pages/BenchmarkPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div
        className="min-h-screen bg-transparent text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]"
      >
        <Navbar />
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
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
