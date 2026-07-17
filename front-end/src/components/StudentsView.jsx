import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { io } from 'socket.io-client';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Users, 
  Check, 
  AlertCircle,
  Mail,
  User,
  Barcode,
  IdCard
} from 'lucide-react';

const StudentsView = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Selected Student for Edit/Delete
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Form states
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRfidUid, setFormRfidUid] = useState('');
  
  // Errors & success
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Auto-fill RFID from hardware scans when registration modal is open
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

  // Fetch Students
  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/students');
      return response.data;
    },
  });

  // Create Student Mutation
  const createMutation = useMutation({
    mutationFn: async (newStudent) => {
      const response = await api.post('/students', newStudent);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setFormSuccess('Student registered successfully!');
      setTimeout(() => {
        setIsAddOpen(false);
        resetForm();
      }, 1000);
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to register student');
    }
  });

  // Update Student Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const response = await api.put(`/students/${id}`, updatedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setFormSuccess('Student updated successfully!');
      setTimeout(() => {
        setIsEditOpen(false);
        resetForm();
      }, 1000);
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update student');
    }
  });

  // Delete Student Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/students/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsDeleteOpen(false);
      setSelectedStudent(null);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to delete student');
    }
  });

  const resetForm = () => {
    setFormFirstName('');
    setFormLastName('');
    setFormStudentId('');
    setFormEmail('');
    setFormRfidUid('');
    setFormError('');
    setFormSuccess('');
    setSelectedStudent(null);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!formFirstName || !formLastName || !formStudentId || !formRfidUid) {
      setFormError('First Name, Last Name, Student ID, and RFID UID are required.');
      return;
    }
    createMutation.mutate({
      name: `${formFirstName.trim()} ${formLastName.trim()}`,
      studentId: formStudentId,
      email: formEmail || null,
      rfidUid: formRfidUid
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!formFirstName || !formLastName || !formStudentId || !formRfidUid) {
      setFormError('First Name, Last Name, Student ID, and RFID UID are required.');
      return;
    }
    updateMutation.mutate({
      id: selectedStudent.id,
      updatedData: {
        name: `${formFirstName.trim()} ${formLastName.trim()}`,
        studentId: formStudentId,
        email: formEmail || null,
        rfidUid: formRfidUid
      }
    });
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    const nameParts = (student.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    setFormFirstName(firstName);
    setFormLastName(lastName);
    setFormStudentId(student.studentId);
    setFormEmail(student.email || '');
    setFormRfidUid(student.rfidUid);
    setIsEditOpen(true);
  };

  const openDeleteModal = (student) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  // Filtered students
  const filteredStudents = students?.filter(student => {
    return (
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      student.rfidUid.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Students Directory</h2>
          <p className="text-slate-500 text-sm mt-0.5">Manage library members and map RFID keycard access credentials.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Student</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-2xl">
        <div className="relative w-full">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 w-4 h-4 my-auto" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, ID card number, email, RFID tag..."
            className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <span>Loading registered directory...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-indigo-600 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load students: {error.message}</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto text-slate-350 mb-3 animate-pulse" />
            <span className="block font-semibold text-slate-400">No students registered</span>
            <span className="block text-xs text-slate-400 mt-1">Add a student to catalog their RFID card and grant library privileges.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Student ID</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">RFID UID</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-850 text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {student.name}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-700">
                      {student.studentId}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {student.email || <span className="text-slate-400/80">No email registered</span>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-650">
                        {student.rfidUid}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(student)}
                          className="p-2 text-slate-450 hover:bg-slate-100 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-slate-700"
                          title="Edit Student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(student)}
                          className="p-2 text-slate-450 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all cursor-pointer text-slate-400"
                          title="Remove Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
            <h3 className="text-xl font-bold text-slate-800 mb-4">Register New Student</h3>
            
            {formError && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-750 text-slate-700 text-xs p-3 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-755 text-indigo-700 text-xs p-3 rounded-lg mb-4">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs font-semibold mb-1.5">First Name *</label>
                  <div className="relative">
                    <User className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                    <input
                      type="text"
                      value={formFirstName}
                      onChange={(e) => setFormFirstName(e.target.value)}
                      placeholder="e.g. Rafiq"
                      className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 text-xs font-semibold mb-1.5">Last Name *</label>
                  <div className="relative">
                    <User className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                    <input
                      type="text"
                      value={formLastName}
                      onChange={(e) => setFormLastName(e.target.value)}
                      placeholder="e.g. Islam"
                      className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5">Student ID *</label>
                <div className="relative">
                  <IdCard className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    placeholder="e.g. STU002"
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. rafiq@example.com"
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">RFID UID (Card Tag ID) - Scan Only</label>
                <div className="relative">
                  <Barcode className="absolute inset-y-0 left-3 text-slate-300 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={formRfidUid}
                    placeholder="Scan RFID card to fill automatically"
                    disabled
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm font-mono bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {isEditOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-fade-in-up border border-slate-200">
            <button 
              onClick={() => setIsEditOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Edit Student Details</h3>

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs font-semibold mb-1.5">First Name *</label>
                  <div className="relative">
                    <User className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                    <input
                      type="text"
                      value={formFirstName}
                      onChange={(e) => setFormFirstName(e.target.value)}
                      className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 text-xs font-semibold mb-1.5">Last Name *</label>
                  <div className="relative">
                    <User className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                    <input
                      type="text"
                      value={formLastName}
                      onChange={(e) => setFormLastName(e.target.value)}
                      className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5">Student ID *</label>
                <div className="relative">
                  <IdCard className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="absolute inset-y-0 left-3 text-slate-400 w-4 h-4 my-auto" />
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">RFID UID (Card Tag ID) - Unchangeable</label>
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

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 text-slate-600 rounded-xl text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {isDeleteOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative animate-fade-in-up border border-slate-200">
            <h3 className="text-lg font-bold text-slate-805 text-slate-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-605 text-indigo-600" />
              <span>Confirm Removal</span>
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{selectedStudent.name}</span>? This will deactivate their profile from the active logs.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 bg-slate-105 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold cursor-pointer"
              >
                Keep Profile
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(selectedStudent.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Removing...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsView;
