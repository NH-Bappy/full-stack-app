import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTopBorrowedBooks, getActiveFines, seedDemoData } from '../api/libraryApi';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  BarChart3, 
  Coins, 
  Sparkles, 
  BookOpen, 
  AlertCircle,
  Database,
  Check,
  RefreshCw
} from 'lucide-react';

const ReportsView = () => {
  const queryClient = useQueryClient();
  const [seedSuccess, setSeedSuccess] = useState('');
  const [seedError, setSeedError] = useState('');

  // Fetch top borrowed books
  const { data: topBooks, isLoading: loadingTopBooks, refetch: refetchTopBooks } = useQuery({
    queryKey: ['reportsTopBorrowed'],
    queryFn: getTopBorrowedBooks,
  });

  // Fetch active fines
  const { data: activeFines, isLoading: loadingFines, refetch: refetchFines } = useQuery({
    queryKey: ['reportsActiveFines'],
    queryFn: getActiveFines,
  });

  // Demo Seeding Mutation
  const seedMutation = useMutation({
    mutationFn: seedDemoData,
    onSuccess: (data) => {
      setSeedSuccess('Demo database seeded successfully with mock students, books, and admin user!');
      setSeedError('');
      // Invalidate all queries to trigger full UI refresh
      queryClient.invalidateQueries();
      setTimeout(() => setSeedSuccess(''), 5000);
    },
    onError: (err) => {
      setSeedError(err.response?.data?.message || 'Failed to seed demo data. Make sure backend is running.');
      setSeedSuccess('');
    }
  });

  // Prepare chart data for top books
  const chartData = topBooks?.map(book => ({
    title: book.title.substring(0, 15) + (book.title.length > 15 ? '...' : ''),
    fullTitle: book.title,
    count: book._count?.transactions || 0
  })) || [];

  const handleSeedClick = () => {
    if (window.confirm('This will seed the database with mock records (STU001-STU003 and BOOK001-BOOK003). Do you wish to proceed?')) {
      seedMutation.mutate();
    }
  };

  const handleSyncClick = () => {
    refetchTopBooks();
    refetchFines();
  };

  // Simplified dual color scale using variations of Indigo
  const colors = ['#312e81', '#3730a3', '#4338ca', '#4f46e5', '#6366f1', '#818cf8', '#93c5fd', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Analytics & Reports</h2>
          <p className="text-slate-500 text-sm mt-0.5">Explore popular trends, review financial metrics, and seed simulator data.</p>
        </div>
        <button
          onClick={handleSyncClick}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-655 text-slate-600 hover:text-slate-900 hover:border-indigo-500/20 hover:bg-slate-50 transition-all text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* Grid: Charts + Fine Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Borrowed books chart (Col 8) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-850 text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-indigo-600" />
              <span>Top Borrowed Books (Popularity Index)</span>
            </h3>
            <p className="text-xs text-slate-505 text-slate-500 mt-0.5">Number of total loans assigned per book since system catalog initialization.</p>
          </div>

          <div className="h-72 mt-2 w-full">
            {loadingTopBooks ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="w-6 h-6 border-4 border-indigo-650 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
                <span>Generating analytics charts...</span>
              </div>
            ) : chartData.length === 0 || chartData.every(d => d.count === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
                <span>No borrow statistics recorded yet.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" />
                  <XAxis dataKey="title" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      color: '#0f172a'
                    }} 
                    formatter={(value) => [value, 'Times Borrowed']}
                    labelFormatter={(label, items) => items[0]?.payload?.fullTitle || label}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Database Utilities (Col 4) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-indigo-650 text-indigo-600" />
              <span>Database Controls</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Quick diagnostic actions to seed simulation datasets.</p>
          </div>

          <div className="space-y-4 my-6">
            <button
              onClick={handleSeedClick}
              disabled={seedMutation.isPending}
              className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {seedMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Seed Simulator Datasets</span>
                </>
              )}
            </button>

            {seedSuccess && (
              <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-indigo-700 text-xs leading-relaxed animate-fade-in">
                <Check className="w-4 h-4 text-indigo-605 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>{seedSuccess}</span>
              </div>
            )}

            {seedError && (
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-700 text-xs leading-relaxed animate-fade-in">
                <AlertCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>{seedError}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-[10px] text-slate-500 leading-relaxed font-semibold">
            <span className="text-slate-700 uppercase tracking-widest block font-bold mb-1">Notice</span>
            Seeding will automatically configure credentials for <code className="text-indigo-605 text-indigo-600 px-1 py-0.5 bg-indigo-50/50 rounded font-mono">admin</code> (Password: <code className="text-indigo-605 text-indigo-600 px-1 py-0.5 bg-indigo-50/50 rounded font-mono">123456</code>) and populate 3 books + 3 students keys.
          </div>
        </div>
      </div>

      {/* Active Fines Audits Section */}
      <div className="glass-panel rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-805 text-slate-850 text-slate-800">Active Fines Ledger</h3>
        </div>

        {loadingFines ? (
          <div className="text-center py-12 text-slate-500">
            <div className="w-6 h-6 border-4 border-indigo-650 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span>Calculating active dues...</span>
          </div>
        ) : !activeFines || activeFines.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Fantastic! No outstanding fine claims exist in the current database.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-550 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Student Member</th>
                  <th className="py-3.5 px-5">Book Details</th>
                  <th className="py-3.5 px-5">Borrowed Date</th>
                  <th className="py-3.5 px-5">Return Status</th>
                  <th className="py-3.5 px-5 text-right">Fine Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeFines.map((trans) => (
                  <tr key={trans.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-800">{trans.student.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">ID: {trans.student.studentId}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-800">{trans.book.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">RFID: {trans.book.rfidUid}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {new Date(trans.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5">
                      {trans.returnDate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-650 text-indigo-600 font-bold uppercase tracking-wider text-[9px]">
                          Returned {new Date(trans.returnDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[9px]">
                          Still Borrowed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right font-extrabold text-indigo-600">
                      ৳{trans.fine}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;
