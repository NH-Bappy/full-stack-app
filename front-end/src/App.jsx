import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import BooksView from './components/BooksView';
import StudentsView from './components/StudentsView';
import BorrowersView from './components/BorrowersView';
import TransactionsView from './components/TransactionsView';
import ReportsView from './components/ReportsView';
import { io } from 'socket.io-client';
import { Users } from 'lucide-react';

function App() {
  const { admin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [booksFilter, setBooksFilter] = useState('all');
  const [transactionsFilter, setTransactionsFilter] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [scannedRfid, setScannedRfid] = useState('');
  const [detectedRfid, setDetectedRfid] = useState(null);

  const isFormOpenRef = useRef(isFormOpen);
  useEffect(() => {
    isFormOpenRef.current = isFormOpen;
  }, [isFormOpen]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_SOCKET_URL || 'http://localhost:3000';
    const socket = io(socketUrl);

    socket.on('rfidScan', (data) => {
      if (data.type === 'unknown') {
        if (!isFormOpenRef.current) {
          setDetectedRfid(data.rfidUid);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const navigateToView = (tab, filterVal) => {
    setActiveTab(tab);
    if (tab === 'books' && filterVal) {
      setBooksFilter(filterVal);
    }
    if (tab === 'transactions' && filterVal !== undefined) {
      setTransactionsFilter(filterVal);
    }
  };

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
        return <DashboardView setActiveTab={setActiveTab} navigateToView={navigateToView} />;
      case 'books':
        return (
          <BooksView 
            initialFilter={booksFilter} 
            setInitialFilter={setBooksFilter} 
            scannedRfid={scannedRfid}
            clearScannedRfid={() => setScannedRfid('')}
            setIsFormOpen={setIsFormOpen}
          />
        );
      case 'students':
        return (
          <StudentsView 
            scannedRfid={scannedRfid}
            clearScannedRfid={() => setScannedRfid('')}
            setIsFormOpen={setIsFormOpen}
          />
        );
      case 'borrowers':
        return <BorrowersView />;
      case 'transactions':
        return <TransactionsView initialShowOverdue={transactionsFilter} setInitialShowOverdue={setTransactionsFilter} />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView setActiveTab={setActiveTab} navigateToView={navigateToView} />;
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

      {/* Global New Card Detection Popup */}
      <AnimatePresence>
        {detectedRfid && (
          <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-50 p-4 pointer-events-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center max-w-sm w-full text-center border border-slate-100"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#0B4262] mb-5 shadow-sm shadow-[#0B4262]/10">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">New Card Detected!</h3>
              <p className="text-slate-550 text-xs mt-2 flex items-center gap-1">Scanned RFID: <strong className="font-mono text-indigo-600">{detectedRfid}</strong></p>
              <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                This RFID card is not registered in our database. Choose an action below to register it.
              </p>

              <div className="flex flex-col gap-2.5 w-full mt-6">
                <button
                  onClick={() => {
                    setScannedRfid(detectedRfid);
                    setActiveTab('students');
                    setDetectedRfid(null);
                  }}
                  className="w-full py-3 bg-[#0B4262] hover:bg-[#083047] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Create Student Member
                </button>
                <button
                  onClick={() => {
                    setScannedRfid(detectedRfid);
                    setActiveTab('books');
                    setDetectedRfid(null);
                  }}
                  className="w-full py-3 bg-white hover:bg-slate-50 text-[#0B4262] border border-[#0B4262]/20 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Create Book Register
                </button>
                <button
                  onClick={() => setDetectedRfid(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold"
                >
                  Ignore Card
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
