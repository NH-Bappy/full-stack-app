import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudents, createStudent, updateStudent, deleteStudent, getStudentById } from '../api/libraryApi';
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
  IdCard,
  BookOpen,
  Calendar
} from 'lucide-react';

const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}${path}`;
};

const StudentAvatar = ({ imagePath, name, size = "w-10 h-10", iconSize = "w-5 h-5" }) => {
  const [hasError, setHasError] = useState(false);

  if (imagePath && !hasError) {
    return (
      <div className={`${size} rounded-full border border-slate-200 bg-slate-105 bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden`}>
        <img
          src={getMediaUrl(imagePath)}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${size} rounded-full border border-slate-200 bg-slate-105 bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden`}>
      <User className={`${iconSize} text-slate-400`} />
    </div>
  );
};

const StudentsView = ({ scannedRfid, clearScannedRfid, setIsFormOpen }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Selected Student for Edit/Delete
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Student Details Modal state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const handleShowDetails = async (studentId) => {
    setIsDetailsLoading(true);
    setDetailsError('');
    setIsDetailsOpen(true);
    setSelectedStudentDetails(null);
    try {
      const data = await getStudentById(studentId);
      setSelectedStudentDetails(data);
    } catch (err) {
      setDetailsError(err.response?.data?.message || 'Failed to load student transaction history.');
    } finally {
      setIsDetailsLoading(false);
    }
  };
  
  // Form states
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRfidUid, setFormRfidUid] = useState('');
  const [profileFile, setProfileFile] = useState(null);
  
  // Errors & success
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Handle scanned RFID redirection
  useEffect(() => {
    if (scannedRfid) {
      setFormRfidUid(scannedRfid);
      setIsAddOpen(true);
      if (clearScannedRfid) clearScannedRfid();
    }
  }, [scannedRfid, clearScannedRfid]);

  // Track if any form modal is open
  useEffect(() => {
    if (setIsFormOpen) {
      setIsFormOpen(isAddOpen || isEditOpen || isDeleteOpen);
    }
  }, [isAddOpen, isEditOpen, isDeleteOpen, setIsFormOpen]);

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
    queryFn: getStudents,
  });

  // Create Student Mutation
  const createMutation = useMutation({
    mutationFn: createStudent,
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
    mutationFn: updateStudent,
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
    mutationFn: deleteStudent,
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
    setProfileFile(null);
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

    const formData = new FormData();
    formData.append('name', `${formFirstName.trim()} ${formLastName.trim()}`);
    formData.append('studentId', formStudentId);
    if (formEmail) formData.append('email', formEmail);
    formData.append('rfidUid', formRfidUid);
    if (profileFile) {
      formData.append('profileImage', profileFile);
    }

    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!formFirstName || !formLastName || !formStudentId || !formRfidUid) {
      setFormError('First Name, Last Name, Student ID, and RFID UID are required.');
      return;
    }

    const formData = new FormData();
    formData.append('name', `${formFirstName.trim()} ${formLastName.trim()}`);
    formData.append('studentId', formStudentId);
    if (formEmail) formData.append('email', formEmail);
    formData.append('rfidUid', formRfidUid);
    if (profileFile) {
      formData.append('profileImage', profileFile);
    }

    updateMutation.mutate({
      id: selectedStudent.id,
      formData: formData
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
    setProfileFile(null);
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
                    <td 
                      onClick={() => handleShowDetails(student.id)}
                      className="py-4 px-6 flex items-center gap-3.5 cursor-pointer"
                    >
                      {/* Student Profile Thumbnail */}
                      <StudentAvatar imagePath={student.profileImage} name={student.name} />
                      <div>
                        <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {student.name}
                        </div>
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

              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5">Profile Image</label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => setProfileFile(e.target.files[0])}
                  className="glass-input w-full px-3.5 py-2 rounded-xl text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Supports PNG, JPG, and JPEG formats. Optional.</span>
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

              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-1.5">Update Profile Image</label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => setProfileFile(e.target.files[0])}
                  className="glass-input w-full px-3.5 py-2 rounded-xl text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Leave empty to keep current profile picture. Supports PNG, JPG, and JPEG.</span>
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

      {/* Student Details Dialog */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative animate-fade-in-up border border-slate-200 max-h-[85vh] flex flex-col">
            <button
              onClick={() => {
                setIsDetailsOpen(false);
                setSelectedStudentDetails(null);
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {isDetailsLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#0B4262] border-t-transparent rounded-full animate-spin mb-4" />
                <span className="text-sm font-semibold text-slate-500">Fetching transaction logs...</span>
              </div>
            ) : detailsError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                <p className="text-sm font-bold text-slate-800">{detailsError}</p>
              </div>
            ) : selectedStudentDetails ? (
              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                {/* Header Profile */}
                <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                  <StudentAvatar 
                    imagePath={selectedStudentDetails.profileImage} 
                    name={selectedStudentDetails.name} 
                    size="w-16 h-16" 
                    iconSize="w-8 h-8" 
                  />
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{selectedStudentDetails.name}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-400 text-xs mt-1">
                      <span>ID: <strong className="text-slate-650">{selectedStudentDetails.studentId}</strong></span>
                      <span>•</span>
                      <span>RFID: <strong className="text-slate-600 font-mono">{selectedStudentDetails.rfidUid}</strong></span>
                      {selectedStudentDetails.email && (
                        <>
                          <span>•</span>
                          <span>{selectedStudentDetails.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Borrowing Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center shadow-sm">
                      <div className="text-2xl font-extrabold text-slate-800">
                        {selectedStudentDetails.transactions.length}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Borrowed</div>
                    </div>
                    <div className="bg-indigo-50/50 border border-indigo-100/40 p-4 rounded-xl text-center shadow-sm">
                      <div className="text-2xl font-extrabold text-[#0B4262]">
                        {selectedStudentDetails.transactions.filter(t => !t.returnDate).length}
                      </div>
                      <div className="text-[10px] font-bold text-[#0B4262] uppercase tracking-wider mt-1">Active Holds</div>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100/40 p-4 rounded-xl text-center shadow-sm">
                      <div className="text-2xl font-extrabold text-emerald-600">
                        {selectedStudentDetails.transactions.filter(t => t.returnDate).length}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">Returned Books</div>
                    </div>
                  </div>
                </div>

                {/* Transactions Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Transaction Records</h4>
                  {selectedStudentDetails.transactions.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-slate-400">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-350" />
                      <span className="text-xs font-bold">No borrow logs found for this student.</span>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr className="border-b border-slate-200">
                            <th className="py-2.5 px-4">Book Title</th>
                            <th className="py-2.5 px-4">Borrow Date</th>
                            <th className="py-2.5 px-4">Return Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedStudentDetails.transactions.map((trans) => (
                            <tr key={trans.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-800 line-clamp-1">{trans.book.title}</div>
                                <div className="text-[9px] font-mono text-slate-400 mt-0.5">{trans.book.rfidUid}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{new Date(trans.borrowDate).toLocaleDateString()}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {trans.returnDate ? (
                                  <span className="text-slate-500 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{new Date(trans.returnDate).toLocaleDateString()}</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 rounded-full">
                                    Active Hold
                                  </span>
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
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsView;
