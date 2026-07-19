import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBorrowingStudents } from '../api/libraryApi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Users, 
  CheckCircle2, 
  Clock, 
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Barcode
} from 'lucide-react';

const BorrowersView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  // Fetch borrowing students
  const { data: students, isLoading, error } = useQuery({
    queryKey: ['borrowingStudents'],
    queryFn: getBorrowingStudents,
  });

  const getMediaUrl = (path) => {
    if (!path) return '';
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}${path}`;
  };

  const getActiveBorrowsCount = (student) => {
    return student.transactions.filter(t => !t.returnDate).length;
  };

  // Filter students based on selection and search query
  const filteredStudents = students?.filter(student => {
    const activeBorrows = getActiveBorrowsCount(student);
    const matchesFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? activeBorrows > 0 :
      filterStatus === 'completed' ? activeBorrows === 0 : true;

    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      student.transactions.some(t => t.book.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  }) || [];

  const toggleExpandStudent = (id) => {
    setExpandedStudentId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Borrowers Directory</h2>
        <p className="text-slate-500 text-sm mt-0.5">View and track all student members who have borrowed books from the library.</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-[#e2e8f0]/60 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 w-4 h-4 my-auto" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, ID, or book..."
            className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          {[
            { id: 'all', label: 'All Borrowers' },
            { id: 'active', label: 'Active Borrowers' },
            { id: 'completed', label: 'Returned All' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${filterStatus === tab.id
                  ? 'bg-[#0B4262] border-[#0B4262] text-white shadow-sm'
                  : 'border-slate-205 border-slate-200 text-slate-505 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-500 flex-1 flex flex-col justify-center items-center">
          <div className="w-8 h-8 border-4 border-[#0B4262] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="font-semibold text-sm">Retrieving borrowers list...</span>
        </div>
      ) : error ? (
        <div className="glass-panel p-6 text-center text-red-650 text-red-650/80 rounded-2xl flex flex-col items-center gap-2 border border-red-100">
          <AlertCircle className="w-8 h-8 text-red-550" />
          <p className="font-semibold text-sm">Failed to load borrowers list</p>
          <span className="text-xs text-slate-500">{error.message}</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#e2e8f0]/40 rounded-3xl flex-1 flex flex-col justify-center items-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-extrabold text-slate-700">No borrowers match your criteria</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {filteredStudents.map((student) => {
            const activeBorrows = getActiveBorrowsCount(student);
            const totalBorrows = student.transactions.length;
            const isExpanded = expandedStudentId === student.id;

            return (
              <motion.div 
                key={student.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel bg-white border border-[#e2e8f0]/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header/Summary Card */}
                <div 
                  onClick={() => toggleExpandStudent(student.id)}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar image or fallback placeholder */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#0B4262]/10 border border-[#0B4262]/15 flex-shrink-0 flex items-center justify-center text-[#0B4262] font-black text-lg">
                      {student.profileImage ? (
                        <img 
                          src={getMediaUrl(student.profileImage)} 
                          alt={student.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                          }}
                        />
                      ) : (
                        student.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug">{student.name}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-450 text-xs mt-1">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> ID: {student.studentId}</span>
                        {student.email && (
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {student.email}</span>
                        )}
                        <span className="flex items-center gap-1"><Barcode className="w-3.5 h-3.5" /> RFID: {student.rfidUid}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    {/* Active borrows badge */}
                    <div className="flex items-center gap-2.5">
                      {activeBorrows > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          {activeBorrows} Active Borrow{activeBorrows > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-50 text-slate-500 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          All Returned
                        </span>
                      )}

                      <span className="text-slate-400 text-xs font-medium">
                        {totalBorrows} total transaction{totalBorrows > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Collapsible Books History List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                    >
                      <div className="p-5 space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Borrowing History</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {student.transactions.map((trans) => {
                            const isBorrowed = !trans.returnDate;
                            return (
                              <div 
                                key={trans.id}
                                className={`p-4 rounded-xl border bg-white flex flex-col justify-between gap-3 shadow-sm ${
                                  isBorrowed ? 'border-indigo-100' : 'border-slate-200/60'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-xs text-slate-800">{trans.book.title}</div>
                                    <div className="text-[10px] text-slate-450 mt-0.5">Author: {trans.book.author}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-1">RFID: {trans.book.rfidUid}</div>
                                  </div>
                                  <div>
                                    {isBorrowed ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] font-bold uppercase tracking-wider">
                                        Borrowed
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-400 text-[8px] font-bold uppercase tracking-wider">
                                        Returned
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-slate-450 border-t border-slate-50 pt-2.5 mt-1">
                                  <span className="flex items-center gap-1 text-slate-500">
                                    <Calendar className="w-3.5 h-3.5 text-slate-450" />
                                    Borrowed: {new Date(trans.borrowDate).toLocaleDateString()}
                                  </span>

                                  {!isBorrowed ? (
                                    <span className="flex items-center gap-1 text-slate-500">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                                      Returned: {new Date(trans.returnDate).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-indigo-500 font-semibold">
                                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                                      Active Borrow
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BorrowersView;
