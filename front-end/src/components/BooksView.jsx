import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBooks, createBook, updateBook, deleteBook } from '../api/libraryApi';
import { io } from 'socket.io-client';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  BookOpen,
  Check,
  AlertCircle,
  Hash,
  User,
  Barcode,
  FileText
} from 'lucide-react';

const BooksView = ({ initialFilter = 'all', setInitialFilter }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialFilter);

  // Sync local filter status when initialFilter prop changes
  useEffect(() => {
    setFilterStatus(initialFilter);
  }, [initialFilter]);

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    if (setInitialFilter) {
      setInitialFilter(status);
    }
  };

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected Book for Edit/Delete
  const [selectedBook, setSelectedBook] = useState(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formIsbn, setFormIsbn] = useState('');
  const [formRfidUid, setFormRfidUid] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);

  // Errors & success
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Auto-fill RFID from hardware scans when add book modal is open
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_SOCKET_URL || 'http://localhost:3000';
    const socket = io(socketUrl);

    socket.on('rfidScan', (data) => {
      if (isAddOpen) {
        setFormRfidUid(data.rfidUid);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isAddOpen]);

  // Fetch Books
  const { data: books, isLoading, error } = useQuery({
    queryKey: ['books'],
    queryFn: getBooks,
  });

  // Create Book Mutation
  const createMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setFormSuccess('Book added successfully!');
      setTimeout(() => {
        setIsAddOpen(false);
        resetForm();
      }, 1000);
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create book');
    }
  });

  // Update Book Mutation
  const updateMutation = useMutation({
    mutationFn: updateBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setFormSuccess('Book updated successfully!');
      setTimeout(() => {
        setIsEditOpen(false);
        resetForm();
      }, 1000);
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update book');
    }
  });

  // Delete Book Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsDeleteOpen(false);
      setSelectedBook(null);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to delete book');
    }
  });

  const resetForm = () => {
    setFormTitle('');
    setFormAuthor('');
    setFormIsbn('');
    setFormRfidUid('');
    setFormAvailable(true);
    setFormError('');
    setFormSuccess('');
    setSelectedBook(null);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle || !formAuthor || !formRfidUid) {
      setFormError('Title, Author, and RFID UID are required.');
      return;
    }

    createMutation.mutate({
      title: formTitle,
      author: formAuthor,
      isbn: formIsbn || '',
      rfidUid: formRfidUid,
      available: formAvailable
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle || !formAuthor || !formRfidUid) {
      setFormError('Title, Author, and RFID UID are required.');
      return;
    }

    updateMutation.mutate({
      id: selectedBook.id,
      updatedData: {
        title: formTitle,
        author: formAuthor,
        isbn: formIsbn || '',
        available: formAvailable
      }
    });
  };

  const openEditModal = (book) => {
    setSelectedBook(book);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormIsbn(book.isbn || '');
    setFormRfidUid(book.rfidUid);
    setFormAvailable(book.available);
    setIsEditOpen(true);
  };

  const openDeleteModal = (book) => {
    setSelectedBook(book);
    setIsDeleteOpen(true);
  };

  // Filtered books
  const filteredBooks = books?.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.isbn && book.isbn.includes(searchTerm)) ||
      book.rfidUid.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'available') return matchesSearch && book.available;
    if (filterStatus === 'borrowed') return matchesSearch && !book.available;
    return matchesSearch;
  }) || [];

  const getMediaUrl = (path) => {
    if (!path) return '';
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}${path}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Books Library</h2>
          <p className="text-slate-500 text-sm mt-0.5">Manage details and check status of RFID registered books.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 w-4 h-4 my-auto" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, author, RFID..."
            className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          {['all', 'available', 'borrowed'].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer border ${filterStatus === status
                  ? 'bg-white border-indigo-600 text-indigo-600 shadow-sm'
                  : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <span>Loading books inventory...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-indigo-650 text-indigo-600 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load books: {error.message}</span>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto text-slate-350 mb-3 animate-pulse" />
            <span className="block font-semibold text-slate-400">No books found</span>
            <span className="block text-xs text-slate-400 mt-1">Try resetting search parameters or create a new entry.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-505 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Book Details</th>
                  <th className="py-4 px-6">ISBN</th>
                  <th className="py-4 px-6">RFID UID</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book) => {
                  return (
                    <tr key={book.id} className="hover:bg-slate-55/30 hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 flex items-center gap-3.5">
                        {/* Book Icon */}
                        <div className="w-10 h-14 rounded border border-slate-200 bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <BookOpen className="w-5 h-5 text-slate-400" />
                        </div>

                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {book.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{book.author}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">
                        {book.isbn || '—'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-600">
                          {book.rfidUid}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {book.available ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Borrowed
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(book)}
                            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-all cursor-pointer"
                            title="Edit Book"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(book)}
                            className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all cursor-pointer"
                            title="Delete Book"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-fade-in-up border border-slate-200">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Register New Book</h3>

            {formError && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs p-3 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs p-3 rounded-lg mb-4">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5">Book Title *</label>
                <div className="relative">
                  <BookOpen className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Design Patterns"
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5">Author *</label>
                <div className="relative">
                  <User className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="e.g. Erich Gamma"
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5">ISBN (Optional)</label>
                <div className="relative">
                  <Hash className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    placeholder="e.g. 9780201633610"
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">RFID UID (Tag Identifier) - Scan Only</label>
                <div className="relative">
                  <Barcode className="absolute inset-y-0 left-3 text-slate-300 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={formRfidUid}
                    placeholder="Scan Book Tag to fill automatically"
                    disabled
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm font-mono bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                  />
                </div>
              </div>



              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="addAvailable"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="addAvailable" className="text-slate-650 text-slate-600 text-xs font-medium cursor-pointer">
                  Mark as Available Immediately
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 text-slate-600 rounded-xl text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {isEditOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-fade-in-up border border-slate-200">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Edit Book Details</h3>

            {formError && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs p-3 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs p-3 rounded-lg mb-4">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5">Book Title *</label>
                <div className="relative">
                  <BookOpen className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5">Author *</label>
                <div className="relative">
                  <User className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5">ISBN (Optional)</label>
                <div className="relative">
                  <Hash className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">RFID UID (Tag Identifier) - Unchangeable</label>
                <div className="relative">
                  <Barcode className="absolute inset-y-0 left-3 text-slate-300 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={formRfidUid}
                    disabled
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm font-mono bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                  />
                </div>
              </div>



              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editAvailable"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="editAvailable" className="text-slate-650 text-slate-600 text-xs font-medium cursor-pointer">
                  Mark as Available
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-slate-105 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-605 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {isDeleteOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative animate-fade-in-up border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-605 text-indigo-600" />
              <span>Confirm Deletion</span>
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{selectedBook.title}</span> from the database? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold cursor-pointer"
              >
                Keep Book
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(selectedBook.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-705 text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BooksView;
