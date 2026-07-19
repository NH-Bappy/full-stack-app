import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboard, getOverdueTransactions } from '../api/libraryApi';
import { motion } from 'framer-motion';
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

const DashboardView = ({ setActiveTab, navigateToView }) => {
  // Fetch overall statistics
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboard,
    refetchInterval: 10000, // Refetch every 10 seconds to keep live
  });

  // Fetch overdue transactions
  const { 
    data: overdueData, 
    isLoading: overdueLoading, 
    error: overdueError 
  } = useQuery({
    queryKey: ['overdueTransactions'],
    queryFn: getOverdueTransactions,
  });

  const isLoading = statsLoading || overdueLoading;

  // Formatting chart data matching the premium Deep Blue & Sky Blue palette
  const pieData = stats ? [
    { name: 'Available Books', value: stats.availableBooks, color: '#0B4262' }, // Deep Blue
    { name: 'Borrowed Books', value: stats.borrowedBooks, color: '#00A2E8' },       // Sky Blue
  ] : [];

  const barData = stats ? [
    { name: 'Total Books', value: stats.totalBooks, fill: '#0B4262' },
    { name: 'Available', value: stats.availableBooks, fill: '#00A2E8' },
    { name: 'Borrowed', value: stats.borrowedBooks, fill: '#0B4262' },
    { name: 'Overdue', value: stats.overdueBooks, fill: '#00A2E8' },
  ] : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } }
  };

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
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[#0B4262] hover:text-[#08324a] hover:border-[#0B4262]/30 hover:bg-slate-50 transition-all text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stats</span>
        </button>
      </div>

      {/* Error display if query fails */}
      {(statsError || overdueError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-3xl text-sm flex items-center gap-3 animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <strong className="font-bold block text-slate-800">Connection or Session Error</strong>
            <span className="text-xs text-red-600 block mt-0.5">
              {statsError?.response?.data?.message || statsError?.message || overdueError?.response?.data?.message || overdueError?.message}
            </span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel h-36 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards in a 4-column grid (Original Layout) */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Card 1: Total Books (Deep Forest Green with white dots) */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -4, boxShadow: "0 12px 20px -8px rgba(11, 66, 98, 0.25)" }}
              className="rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-md bg-[#0B4262] text-white dot-pattern-white cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => navigateToView && navigateToView('books', 'all')}
            >
              <div className="flex items-start justify-between z-10">
                <div>
                  <span className="text-[10px] font-bold text-[#c2ccd1] uppercase tracking-wider block">
                    Total Books
                  </span>
                  <span className="text-3xl font-black text-white tracking-tight mt-1.5 block">
                    {stats ? stats.totalBooks.toLocaleString() : '0'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/10 text-white backdrop-blur-md">
                  <BookOpen className="w-5 h-5 text-[#00A2E8]" />
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 mt-4 flex items-center justify-between text-xs z-10">
                <span className="text-[#c2ccd1] font-medium">Total books in library catalog</span>
                <Users className="w-3.5 h-3.5 text-[#c2ccd1]" />
              </div>
            </motion.div>

            {/* Card 2: Available Books (White Card with gray dots) */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -4, boxShadow: "0 12px 20px -8px rgba(11, 66, 98, 0.08)" }}
              className="glass-panel rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-sm bg-white dot-pattern-gray cursor-pointer hover:shadow-md transition-all duration-300"
              onClick={() => navigateToView && navigateToView('books', 'available')}
            >
              <div className="flex items-start justify-between z-10">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Available Books
                  </span>
                  <span className="text-3xl font-black text-[#0B4262] tracking-tight mt-1.5 block">
                    {stats ? stats.availableBooks.toLocaleString() : '0'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 text-slate-500">
                  <CheckCircle2 className="w-5 h-5 text-[#0B4262]" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs z-10">
                <span className="text-slate-400 font-medium">Books ready for borrowing</span>
                <Users className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </motion.div>

            {/* Card 3: Active Borrows (White Card with gray dots) */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -4, boxShadow: "0 12px 20px -8px rgba(11, 66, 98, 0.08)" }}
              className="glass-panel rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-sm bg-white dot-pattern-gray cursor-pointer hover:shadow-md transition-all duration-300"
              onClick={() => navigateToView && navigateToView('books', 'borrowed')}
            >
              <div className="flex items-start justify-between z-10">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Borrows
                  </span>
                  <span className="text-3xl font-black text-[#1e293b] tracking-tight mt-1.5 block">
                    {stats ? stats.borrowedBooks.toLocaleString() : '0'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 text-slate-500">
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs z-10">
                <span className="text-slate-400 font-medium">Currently borrowed out</span>
                <Users className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </motion.div>

            {/* Card 4: Overdue Books (White Card with gray dots) */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -4, boxShadow: "0 12px 20px -8px rgba(11, 66, 98, 0.08)" }}
              className="glass-panel rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-sm bg-white dot-pattern-gray cursor-pointer hover:shadow-md transition-all duration-300"
              onClick={() => navigateToView && navigateToView('transactions', true)}
            >
              <div className="flex items-start justify-between z-10">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Overdue Books
                  </span>
                  <span className="text-3xl font-black text-slate-800 tracking-tight mt-1.5 block">
                    {stats ? stats.overdueBooks.toLocaleString() : '0'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-red-50 text-red-500">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs z-10">
                <span className="text-slate-400 font-medium">Returned past standard term</span>
                <Users className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </motion.div>
          </motion.div>

          {/* Charts Row: Inventory Ratio (Pie) and Status Overview (Bar) */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Pie Chart Card: Inventory Ratio (Sage gradient card) */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -2 }}
              className="bg-gradient-to-b from-[#C2CFC6] to-[#DFE5E1] border border-white/40 shadow-sm rounded-3xl p-6 flex flex-col"
            >
              <h3 className="text-base font-extrabold text-slate-800 mb-1">Inventory Ratio</h3>
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
                          borderColor: 'rgba(11, 66, 98, 0.1)',
                          borderRadius: '12px',
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
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total</span>
                  </div>
                )}
              </div>

              {/* Legends */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4 mt-auto">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <div>
                      <span className="block text-xs font-semibold text-slate-500">{item.name}</span>
                      <span className="block text-sm font-bold text-slate-800">
                        {item.value} ({stats && stats.totalBooks > 0 ? Math.round((item.value / stats.totalBooks) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bar Chart: Book Summary / Status Overview */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -2 }}
              className="glass-panel rounded-3xl p-6 flex flex-col lg:col-span-2 bg-white"
            >
              <h3 className="text-base font-extrabold text-slate-800 mb-1">Status Overview</h3>
              <p className="text-xs text-slate-500 mb-4">Detailed distribution breakdown of books in catalog</p>

              <div className="h-64 mt-auto">
                {stats && stats.totalBooks === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">No books cataloged</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(11, 66, 98, 0.04)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(11, 66, 98, 0.01)' }}
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          borderColor: 'rgba(11, 66, 98, 0.1)',
                          borderRadius: '12px',
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
            </motion.div>
          </motion.div>

          {/* Bottom Table: Overdue Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 120, damping: 18 }}
            className="glass-panel rounded-3xl p-6 bg-white shadow-sm mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0B4262]" />
                <h3 className="text-base font-extrabold text-slate-800">Overdue Borrow Operations</h3>
              </div>
              <button 
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-semibold text-[#0B4262] hover:text-[#08324a] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Manage Transactions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {overdueData && overdueData.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl">
                Hurray! There are no overdue transactions in the library database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">RFID Code</th>
                      <th className="py-3 px-4">Borrow Date</th>
                      <th className="py-3 px-4 text-right">Estimated Fine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueData?.slice(0, 5).map((trans) => {
                      const overdueDays = Math.max(1, Math.ceil((Date.now() - new Date(trans.borrowDate).getTime()) / (1000 * 60 * 60 * 24))) - 7;
                      const estimatedFine = overdueDays > 0 ? overdueDays * 10 : 0;
                      
                      return (
                        <tr key={trans.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 text-xs">{trans.student.name}</div>
                            <div className="text-[10px] text-slate-400">{trans.student.studentId}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium text-xs">{trans.book.title}</td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
                              {trans.book.rfidUid}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-xs">
                            {new Date(trans.borrowDate).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-xs text-[#0B4262]">
                            ৳{estimatedFine}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default DashboardView;
