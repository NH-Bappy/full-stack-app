import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { returnBook } from './api/libraryApi';
import { io } from 'socket.io-client';
import { Users, RotateCcw } from 'lucide-react';

function App() {
  const queryClient = useQueryClient();
  const { admin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [booksFilter, setBooksFilter] = useState('all');
  const [transactionsFilter, setTransactionsFilter] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [scannedRfid, setScannedRfid] = useState('');
  const [detectedRfid, setDetectedRfid] = useState(null);
  const [returnNotification, setReturnNotification] = useState(null);

  const isFormOpenRef = useRef(isFormOpen);
  useEffect(() => {
    isFormOpenRef.current = isFormOpen;
  }, [isFormOpen]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_SOCKET_URL || 'http://localhost:3000';
    const socket = io(socketUrl);

    socket.on('bookReturned', (data) => {
      // Invalidate queries globally so all active views update immediately
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });

      // Trigger global notification banner on every page with student details
      setReturnNotification({
        bookTitle: data.book?.title || 'Book',
        fine: data.fine || 0,
        student: data.student || null,
        autoReturned: data.autoReturned || false,
      });

      setTimeout(() => {
        setReturnNotification(null);
      }, 5000);
    });

    socket.on('bookBorrowed', () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    });

    socket.on('rfidScan', async (data) => {
      if (data.type === 'unknown') {
        if (!isFormOpenRef.current) {
          setDetectedRfid(data.rfidUid);
        }
      } else if (data.type === 'book' && !data.book.available && !data.autoReturned) {
        // Global fallback: if scanned book is borrowed and wasn't auto-returned by backend scan, return it now
        try {
          await returnBook({ bookRfidUid: data.rfidUid });
        } catch (err) {
          console.error('Global auto-return failed:', err?.response?.data?.message || err.message);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

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

      {/* Global Book Returned Toast Notification */}
      <AnimatePresence>
        {returnNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#0B4262] text-white rounded-2xl shadow-2xl p-4 border border-[#0B4262]/40 flex items-start gap-3.5 backdrop-blur-md"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 flex-shrink-0 mt-0.5 shadow-sm">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                  {returnNotification.autoReturned ? '⚡ Auto-Returned Book' : '📖 Book Returned'}
                </h4>
                <button
                  onClick={() => setReturnNotification(null)}
                  className="text-slate-300 hover:text-white text-xs px-1 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm font-semibold text-white truncate mt-0.5">
                "{returnNotification.bookTitle}"
              </p>
              
              {/* Student details display */}
              {returnNotification.student ? (
                <div className="mt-2 pt-2 border-t border-white/10 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="font-bold text-white truncate">{returnNotification.student.name}</span>
                    <span className="text-[10px] font-mono bg-white/15 px-1.5 py-0.5 rounded text-emerald-300 font-bold">
                      ID: {returnNotification.student.studentId}
                    </span>
                  </div>
                  {returnNotification.student.department && (
                    <div className="text-[11px] text-slate-300 flex items-center justify-between">
                      <span>Dept: {returnNotification.student.department}</span>
                      {returnNotification.fine > 0 ? (
                        <span className="text-amber-300 font-bold ml-2">Fine: ৳{returnNotification.fine}</span>
                      ) : (
                        <span className="text-emerald-300 font-bold ml-2">No Fine</span>
                      )}
                    </div>
                  )}
                  {!returnNotification.student.department && (
                    <div className="flex justify-end">
                      {returnNotification.fine > 0 ? (
                        <span className="text-amber-300 font-bold">Fine: ৳{returnNotification.fine}</span>
                      ) : (
                        <span className="text-emerald-300 font-bold">No Fine</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-200 mt-1 flex items-center justify-between font-medium">
                  <span>Returned to library collection</span>
                  {returnNotification.fine > 0 ? (
                    <span className="text-amber-300 font-bold ml-2">Fine: ৳{returnNotification.fine}</span>
                  ) : (
                    <span className="text-emerald-300 font-bold ml-2">No Fine</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
