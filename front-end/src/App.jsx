import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
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
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-800 font-sans relative">
      {/* Soft Background Accent Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-slate-500/5 blur-[120px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto px-8 py-6 relative">
        {/* Top Navbar */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              RFID Network Online
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span>Terminal: <strong className="text-slate-800">#MAIN_DESK</strong></span>
            <span className="text-slate-350 text-slate-300">|</span>
            <span>API Status: <strong className="text-indigo-600">Connected</strong></span>
          </div>
        </header>

        {/* View Component container with entrance animation */}
        <div className="flex-1 pb-12 animate-fade-in-up">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}

export default App;
