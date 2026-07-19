import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBooks, getStudents, getTransactions, issueBook, returnBook } from '../api/libraryApi';
import { 
  Radio, 
  BookOpen, 
  User, 
  ArrowRightLeft, 
  RotateCcw,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Clock,
  RefreshCw,
  Search
} from 'lucide-react';
import { io } from 'socket.io-client';

const TransactionsView = ({ initialShowOverdue = false, setInitialShowOverdue }) => {
  const queryClient = useQueryClient();
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(initialShowOverdue);

  // Sync local showOnlyOverdue state with initialShowOverdue prop changes
  useEffect(() => {
    setShowOnlyOverdue(initialShowOverdue);
  }, [initialShowOverdue]);

  const toggleShowOverdue = () => {
    const nextVal = !showOnlyOverdue;
    setShowOnlyOverdue(nextVal);
    if (setInitialShowOverdue) {
      setInitialShowOverdue(nextVal);
    }
  };

  // Operation state
  const [mode, setMode] = useState('issue'); // issue, return
  const [studentId, setStudentId] = useState('');
  const [studentRfid, setStudentRfid] = useState('');
  const [bookRfid, setBookRfid] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Refs to avoid stale closures in WebSocket event listeners
  const studentRfidRef = useRef(studentRfid);
  const studentIdRef = useRef(studentId);
  const issueMutationRef = useRef(null);
  const returnMutationRef = useRef(null);

  // Synchronize state values to refs
  useEffect(() => {
    studentRfidRef.current = studentRfid;
  }, [studentRfid]);

  useEffect(() => {
    studentIdRef.current = studentId;
  }, [studentId]);

  // RFID Simulator State
  const [selectedSimStudent, setSelectedSimStudent] = useState('');
  const [selectedSimBook, setSelectedSimBook] = useState('');

  // Socket logs
  const [socketLogs, setSocketLogs] = useState([]);

  // Fetch registered books & students for the simulator dropdowns
  const { data: books } = useQuery({
    queryKey: ['books'],
    queryFn: getBooks,
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
  });

  // Fetch transactions list
  const { data: transactions, isLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['transactions', showOnlyOverdue],
    queryFn: () => getTransactions(showOnlyOverdue),
  });

  // Websocket client setup
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_SOCKET_URL || 'http://localhost:3000';
    const socket = io(socketUrl);

    socket.on('connect', () => {
      addSocketLog('System connected to live RFID RFID sensor hub.');
    });

    socket.on('bookIssued', (data) => {
      addSocketLog(`[SCAN] Book "${data.book.title}" (RFID: ${data.book.rfidUid}) ISSUED to ${data.student.name}`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    });

    socket.on('bookReturned', (data) => {
      addSocketLog(`[SCAN] Book "${data.book.title}" (RFID: ${data.book.rfidUid}) RETURNED. Fine: ৳${data.fine}`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    });

    socket.on('rfidScan', (data) => {
      if (data.type === 'student') {
        setStudentRfid(data.rfidUid);
        setStudentId(data.student.studentId); // Auto-fill Student ID from database
        addSocketLog(`[HARDWARE] Student Scanned: ${data.student.name} (RFID: ${data.rfidUid})`);
        setMessage({ type: 'success', text: `Hardware scanned Student: ${data.student.name}` });
      } else if (data.type === 'book') {
        setBookRfid(data.rfidUid);
        addSocketLog(`[HARDWARE] Book Scanned: "${data.book.title}" (RFID: ${data.rfidUid})`);
        
        // Auto-run action logic based on book availability
        const currentStudentRfid = studentRfidRef.current;
        const currentStudentId = studentIdRef.current;
        const isAvailable = data.book.available; // true = in library, false = checked out

        if (!isAvailable) {
          // Automatically return the book since it is checked out
          setMessage({ type: 'success', text: `Auto-returning book: "${data.book.title}"...` });
          if (returnMutationRef.current) {
            returnMutationRef.current.mutate({ bookRfidUid: data.rfidUid });
          }
        } else {
          // Book is available, try to issue it
          if (currentStudentRfid || currentStudentId) {
            setMessage({ type: 'success', text: `Auto-issuing "${data.book.title}"...` });
            if (issueMutationRef.current) {
              issueMutationRef.current.mutate({
                studentId: currentStudentId || null,
                studentRfidUid: currentStudentRfid || null,
                bookRfidUid: data.rfidUid
              });
            }
          } else {
            setMessage({ 
              type: 'warning', 
              text: `Book "${data.book.title}" is available. Scan a student card first to issue it!` 
            });
          }
        }
      } else {
        addSocketLog(`[HARDWARE] Unknown Card Scanned: ${data.rfidUid}`);
        setMessage({ type: 'warning', text: `Hardware scanned unknown card: ${data.rfidUid}` });
      }
    });

    socket.on('disconnect', () => {
      addSocketLog('System disconnected from RFID sensor hub.');
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const addSocketLog = (text) => {
    setSocketLogs((prev) => [{ time: new Date().toLocaleTimeString(), text }, ...prev].slice(0, 15));
  };

  // Issue Book Mutation
  const issueMutation = useMutation({
    mutationFn: issueBook,
    onSuccess: (data) => {
      setMessage({ type: 'success', text: `${data.message || 'Book issued successfully!'} - Confirmed by Administration` });
      setStudentId('');
      setStudentRfid('');
      setBookRfid('');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to issue book' });
    }
  });

  // Keep mutation ref updated
  useEffect(() => {
    issueMutationRef.current = issueMutation;
  }, [issueMutation]);

  // Return Book Mutation
  const returnMutation = useMutation({
    mutationFn: returnBook,
    onSuccess: (data) => {
      const fineText = data.fine > 0 ? ` Fine due: ৳${data.fine}` : '';
      setMessage({ type: 'success', text: `${data.message || 'Book returned successfully!'}${fineText} - Confirmed by Administration` });
      setBookRfid('');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to return book' });
    }
  });

  // Keep mutation ref updated
  useEffect(() => {
    returnMutationRef.current = returnMutation;
  }, [returnMutation]);

  const handleIssueSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if ((!studentId && !studentRfid) || !bookRfid) {
      setMessage({ type: 'error', text: 'Specify either Student ID or RFID card, and the Book RFID tag.' });
      return;
    }
    issueMutation.mutate({
      studentId: studentId || null,
      studentRfidUid: studentRfid || null,
      bookRfidUid: bookRfid
    });
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!bookRfid) {
      setMessage({ type: 'error', text: 'Book RFID is required.' });
      return;
    }
    returnMutation.mutate({ bookRfidUid: bookRfid });
  };

  // Trigger simulated RFID Swipe
  const triggerSimulation = () => {
    setMessage({ type: '', text: '' });
    if (mode === 'issue') {
      if (!selectedSimStudent || !selectedSimBook) {
        setMessage({ type: 'error', text: 'Select a student and a book to mock the issue transaction.' });
        return;
      }
      issueMutation.mutate({
        studentRfidUid: selectedSimStudent,
        bookRfidUid: selectedSimBook
      });
    } else {
      if (!selectedSimBook) {
        setMessage({ type: 'error', text: 'Select a book to mock the return transaction.' });
        return;
      }
      returnMutation.mutate({
        bookRfidUid: selectedSimBook
      });
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions?.filter(trans => {
    const term = searchTerm.toLowerCase();
    return (
      trans.student.name.toLowerCase().includes(term) ||
      trans.student.studentId.toLowerCase().includes(term) ||
      trans.book.title.toLowerCase().includes(term) ||
      trans.book.rfidUid.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">RFID Console</h2>
        <p className="text-slate-500 text-sm mt-0.5">Control borrow-return operations, review database audits, and simulate RFID swipe events.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RFID Operation console (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-6 shadow-md relative overflow-hidden">
            {/* Header switches */}
            <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-xl mb-6">
              <button
                onClick={() => {
                  setMode('issue');
                  setMessage({ type: '', text: '' });
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'issue'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Issue Book</span>
              </button>
              <button
                onClick={() => {
                  setMode('return');
                  setMessage({ type: '', text: '' });
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'return'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return Book</span>
              </button>
            </div>

            {/* Error & Success notifications */}
            {message.text && (
              <div className={`flex items-start gap-2.5 p-4 rounded-xl text-xs font-bold mb-6 border ${
                message.type === 'success'
                  ? 'bg-indigo-50 border-indigo-150 border-indigo-100 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4.5 h-4.5 text-indigo-650 text-indigo-600 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Manual Swipe Form */}
            <form onSubmit={mode === 'issue' ? handleIssueSubmit : handleReturnSubmit} className="space-y-4">
              {mode === 'issue' && (
                <>
                  <div>
                    <label className="block text-slate-505 text-slate-505 text-slate-500 text-xs font-semibold mb-1.5">Student identifier</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <User className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                        <input
                          type="text"
                          value={studentId}
                          placeholder="Student ID (Auto-fill)"
                          disabled
                          className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                        />
                      </div>
                      <div className="relative">
                        <Radio className="absolute inset-y-0 left-3 text-slate-300 w-4 h-4 my-auto" />
                        <input
                          type="text"
                          value={studentRfid}
                          placeholder="Scan Card (Auto-fill)"
                          disabled
                          className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">Book RFID Tag UID - Scan Only</label>
                <div className="relative">
                  <BookOpen className="absolute inset-y-0 left-3 text-slate-300 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={bookRfid}
                    placeholder="Scan Book Tag (Auto-fill)"
                    disabled
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-xs font-mono bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={issueMutation.isPending || returnMutation.isPending}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                {issueMutation.isPending || returnMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Manual Operation</span>
                  </>
                )}
              </button>
            </form>

            {/* RFID Scanner Simulator Section */}
            <div className="border-t border-slate-100 pt-6 mt-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">RFID Scanner Simulator</h4>
              <div className="space-y-3.5 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                {mode === 'issue' && (
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Select Simulated Student Card</label>
                    <select
                      value={selectedSimStudent}
                      onChange={(e) => setSelectedSimStudent(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-lg text-xs"
                    >
                      <option value="">-- Choose Student Card --</option>
                      {students?.map(s => (
                        <option key={s.id} value={s.rfidUid}>{s.name} ({s.rfidUid})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Select Simulated Book Tag</label>
                  <select
                    value={selectedSimBook}
                    onChange={(e) => setSelectedSimBook(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-lg text-xs"
                  >
                    <option value="">-- Choose Book Tag --</option>
                    {books?.map(b => (
                      <option key={b.id} value={b.rfidUid} disabled={mode === 'issue' && !b.available}>
                        {b.title} ({b.rfidUid}) {!b.available ? '[Checked Out]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={triggerSimulation}
                  disabled={issueMutation.isPending || returnMutation.isPending}
                  className="w-full py-2 bg-white hover:bg-slate-50 text-indigo-600 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all border border-indigo-500/20 hover:border-indigo-500/35"
                >
                  <Terminal className="w-3.5 h-3.5 text-indigo-650" />
                  <span>Mock RFID Swipes</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Scanner Log Feed */}
          <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-1.5 mb-3 border-b border-slate-100 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live RFID Event Stream</h4>
            </div>

            <div className="h-44 overflow-y-auto font-mono text-[11px] text-slate-600 space-y-1.5 pr-2">
              {socketLogs.length === 0 ? (
                <div className="text-slate-400 italic py-8 text-center">
                  Waiting for RFID scan triggers...
                </div>
              ) : (
                socketLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 leading-relaxed">
                    <span className="text-slate-400 flex-shrink-0">[{log.time}]</span>
                    <span className="text-indigo-600 font-bold">{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Transactions list (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 shadow-md flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Operations Auditing Log</h3>
                <p className="text-xs text-slate-500 mt-0.5">Chronological record of issue and return events.</p>
              </div>
              <button
                onClick={() => refetchTransactions()}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-205 border-slate-200 rounded-lg text-slate-505 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all text-xs font-bold cursor-pointer w-fit"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync Logs</span>
              </button>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="relative">
                <Search className="absolute inset-y-0 left-3 text-slate-400 w-3.5 h-3.5 my-auto" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs..."
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
                />
              </div>

              <button
                type="button"
                onClick={toggleShowOverdue}
                className={`py-2 px-3 rounded-xl text-xs font-bold cursor-pointer border flex items-center justify-center gap-1.5 transition-all ${
                  showOnlyOverdue
                    ? 'bg-indigo-50 border-indigo-500/35 text-indigo-600'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Show Only Overdue</span>
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-slate-500">
                <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Syncing logs...</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl my-auto">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <span className="block font-semibold">No transactions registered</span>
                <span className="block text-xs text-slate-400 mt-1">Issue a book using the console to create an audit record.</span>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[500px] border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-650 text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Book</th>
                      <th className="py-3 px-4">Issue / Return</th>
                      <th className="py-3 px-4 text-right">Fine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((trans) => (
                      <tr key={trans.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{trans.student.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">ID: {trans.student.studentId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 line-clamp-1">{trans.book.title}</div>
                          <div className="text-[10px] font-mono text-indigo-600 mt-0.5">{trans.book.rfidUid}</div>
                        </td>
                        <td className="py-3 px-4 space-y-1">
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-indigo-600 font-bold uppercase tracking-widest text-[8px]">Issued</span>
                            <span className="text-slate-500">
                              {new Date(trans.issueDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-400 uppercase tracking-widest text-[8px] font-bold">Returned</span>
                            <span className="text-slate-600">
                              {trans.returnDate ? (
                                new Date(trans.returnDate).toLocaleDateString()
                              ) : (
                                <span className="text-indigo-500 font-bold">Pending return</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-700">
                          {trans.fine > 0 ? (
                            <span className="text-indigo-650 text-indigo-600">৳{trans.fine}</span>
                          ) : trans.returnDate ? (
                            <span className="text-slate-400">৳0</span>
                          ) : (
                            <span className="text-slate-350 text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsView;
