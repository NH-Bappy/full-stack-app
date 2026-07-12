import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

const DashboardView = ({ setActiveTab }) => {
  // Fetch overall statistics
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds to keep live
  });

  // Fetch overdue transactions
  const { data: overdueData, isLoading: overdueLoading } = useQuery({
    queryKey: ['overdueTransactions'],
    queryFn: async () => {
      const response = await api.get('/transactions/overdue');
      return response.data;
    },
  });

  const isLoading = statsLoading || overdueLoading;

  // Formatting chart data matching the light Slate & Indigo palette
  const pieData = stats ? [
    { name: 'Available Books', value: stats.availableBooks, color: '#4f46e5' }, // Indigo-600
    { name: 'Issued Books', value: stats.issuedBooks, color: '#cbd5e1' },    // Slate-300
  ] : [];

  const barData = stats ? [
    { name: 'Total Books', value: stats.totalBooks, fill: '#312e81' },
    { name: 'Available', value: stats.availableBooks, fill: '#4f46e5' },
    { name: 'Issued', value: stats.issuedBooks, fill: '#818cf8' },
    { name: 'Overdue', value: stats.overdueBooks, fill: '#cbd5e1' },
  ] : [];

  const statCards = stats ? [
    {
      title: 'Total Books',
      value: stats.totalBooks,
      icon: BookOpen,
      color: 'from-indigo-500 to-indigo-650 bg-indigo-600',
      shadow: 'shadow-indigo-500/10',
      description: 'Total books in library catalog',
    },
    {
      title: 'Available Books',
      value: stats.availableBooks,
      icon: CheckCircle2,
      color: 'from-indigo-500 to-indigo-650 bg-indigo-600',
      shadow: 'shadow-indigo-500/10',
      description: 'Books ready for borrowing',
    },
    {
      title: 'Active Borrows',
      value: stats.issuedBooks,
      icon: TrendingUp,
      color: 'from-indigo-500 to-indigo-650 bg-indigo-600',
      shadow: 'shadow-indigo-500/10',
      description: 'Currently issued out',
    },
    {
      title: 'Overdue Books',
      value: stats.overdueBooks,
      icon: AlertTriangle,
      color: 'from-indigo-500 to-indigo-650 bg-indigo-600',
      shadow: 'shadow-indigo-500/10',
      description: 'Returned past standard term',
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Status</h2>
          <p className="text-slate-500 text-sm mt-0.5">Real-time indicators for books, members, and active RFID status.</p>
        </div>
        <button
          onClick={() => refetchStats()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:border-indigo-500/35 hover:bg-slate-50 transition-all text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stats</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel h-36 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div 
                  key={idx} 
                  className="glass-panel rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-md glass-panel-hover"
                >
                  {/* Card Glow Effect */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl transform translate-x-6 -translate-y-6 group-hover:scale-125 transition-transform" />
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        {card.title}
                      </span>
                      <span className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1.5 block">
                        {card.value}
                      </span>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-tr ${card.color} shadow-lg ${card.shadow} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">{card.description}</span>
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart: Availability */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col lg:col-span-1">
              <h3 className="text-base font-bold text-slate-800 mb-1">Inventory Ratio</h3>
              <p className="text-xs text-slate-500 mb-4">Availability status breakdown</p>
              
              <div className="h-64 flex items-center justify-center relative">
                {stats && stats.totalBooks === 0 ? (
                  <div className="text-slate-500 text-sm">No books registered</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          borderColor: '#e2e8f0',
                          borderRadius: '8px',
                          color: '#0f172a'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                
                {/* Total Counter inside Pie */}
                {stats && stats.totalBooks > 0 && (
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-800">{stats.totalBooks}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
                  </div>
                )}
              </div>

              {/* Legends */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-auto">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <div>
                      <span className="block text-xs font-semibold text-slate-500">{item.name}</span>
                      <span className="block text-sm font-bold text-slate-800">{item.value} ({stats && stats.totalBooks > 0 ? Math.round((item.value / stats.totalBooks) * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart: Book Summary */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col lg:col-span-2">
              <h3 className="text-base font-bold text-slate-800 mb-1">Status Overview</h3>
              <p className="text-xs text-slate-500 mb-4">Detailed distribution breakdown of books in catalog</p>

              <div className="h-64 mt-auto">
                {stats && stats.totalBooks === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">No books cataloged</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(99, 102, 241, 0.02)' }}
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          borderColor: '#e2e8f0',
                          borderRadius: '8px',
                          color: '#0f172a'
                        }} 
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Table: Overdue Actions */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">Overdue Borrow Operations</h3>
              </div>
              <button 
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Manage Transactions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {overdueData && overdueData.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                Hurray! There are no overdue transactions in the library database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">RFID Code</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4 text-right">Estimated Fine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueData?.slice(0, 5).map((trans) => {
                      const overdueDays = Math.max(1, Math.ceil((Date.now() - new Date(trans.issueDate).getTime()) / (1000 * 60 * 60 * 24))) - 7;
                      const estimatedFine = overdueDays > 0 ? overdueDays * 10 : 0;
                      
                      return (
                        <tr key={trans.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{trans.student.name}</div>
                            <div className="text-xs text-slate-400">{trans.student.studentId}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{trans.book.title}</td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-600">
                              {trans.book.rfidUid}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(trans.issueDate).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-indigo-600">
                            ৳{estimatedFine}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardView;
