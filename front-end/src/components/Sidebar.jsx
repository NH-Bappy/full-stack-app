import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Radio, 
  BarChart3, 
  LogOut, 
  User
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { admin, logout } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Books Catalog', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'transactions', label: 'RFID Console', icon: Radio },
    { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-750 bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/10">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-slate-800 text-lg tracking-tight block leading-none">
            BIBLIO<span className="text-indigo-600">RFID</span>
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1 block">
            Admin v1.0
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Profile Details */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
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
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-600/35 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 text-sm font-bold transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
