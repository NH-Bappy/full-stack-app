import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import BooksView from './components/BooksView';
import StudentsView from './components/StudentsView';
import TransactionsView from './components/TransactionsView';
import ReportsView from './components/ReportsView';

function App() {
  const { admin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Restoring Admin session...</span>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} />;
      case 'books':
        return <BooksView />;
      case 'students':
        return <StudentsView />;
      case 'transactions':
        return <TransactionsView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#EAE5E0] text-slate-800 font-sans relative">
      {/* Soft Background Accent Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#0b4262]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-slate-500/5 blur-[120px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto px-8 py-6 relative">
        {/* Top Navbar */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/40">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0b4262]/10 text-[#0b4262] border border-[#0b4262]/15">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A2E8] animate-pulse" />
              RFID Network Online
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span>Terminal: <strong className="text-slate-800">#MAIN_DESK</strong></span>
            <span className="text-slate-300">|</span>
            <span>API Status: <strong className="text-[#0b4262]">Connected</strong></span>
          </div>
        </header>

        {/* View Component container with entrance animation */}
        <div className="flex-1 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="h-full flex flex-col"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
