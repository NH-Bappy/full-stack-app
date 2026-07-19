import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Radio, 
  BarChart3, 
  LogOut, 
  User,
  UserCheck
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { admin, logout } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Books Catalog', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'borrowers', label: 'Borrowers', icon: UserCheck },
    { id: 'transactions', label: 'RFID Console', icon: Radio },
    { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#e2e8f0]/40 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100/60 flex items-center gap-3">
        <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center">
          <img src={logo} alt="GGAI Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <span className="font-extrabold text-slate-800 text-[13px] tracking-tight block leading-none">
            GGAI <span className="text-[#0B4262]">RFID</span>
          </span>
          <span className="text-[9px] text-[#0B4262] uppercase tracking-wider font-bold mt-1 block">
            Graphic Arts Inst.
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer relative ${
                isActive
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavBackground"
                  className="absolute inset-0 bg-[#0B4262] rounded-xl -z-10 shadow-lg shadow-[#0B4262]/15"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`w-4 h-4 z-10 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="z-10">{item.label}</span>
              {isActive && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white z-10" 
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom section forced to screen bottom */}
      <div className="mt-auto flex flex-col">

        {/* Admin Profile Details */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-lg bg-[#0B4262]/10 border border-[#0B4262]/15 flex items-center justify-center text-[#0B4262]">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-sm font-bold text-slate-700 truncate">
                {admin?.username || 'Admin User'}
              </span>
              <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                System Administrator
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-[#0B4262]/30 hover:bg-[#0B4262]/5 text-slate-500 hover:text-[#0B4262] text-sm font-bold transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
