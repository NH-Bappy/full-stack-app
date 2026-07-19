import api from './axios';

// Auth APIs
export const loginAdmin = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const registerAdmin = async (username, password) => {
  const response = await api.post('/auth/register', { username, password });
  return response.data;
};

// Books APIs
export const getBooks = async () => {
  const response = await api.get('/books');
  return response.data;
};

export const createBook = async (newBook) => {
  const response = await api.post('/books', newBook);
  return response.data;
};

export const updateBook = async ({ id, updatedData }) => {
  const response = await api.put(`/books/${id}`, updatedData);
  return response.data;
};

export const deleteBook = async (id) => {
  const response = await api.delete(`/books/${id}`);
  return response.data;
};

// Students APIs
export const getStudents = async () => {
  const response = await api.get('/students');
  return response.data;
};

export const createStudent = async (formData) => {
  const response = await api.post('/students', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateStudent = async ({ id, formData }) => {
  const response = await api.put(`/students/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteStudent = async (id) => {
  const response = await api.delete(`/students/${id}`);
  return response.data;
};

// Transactions APIs
export const getTransactions = async (showOnlyOverdue) => {
  const endpoint = showOnlyOverdue ? '/transactions/overdue' : '/transactions';
  const response = await api.get(endpoint);
  return response.data;
};

export const borrowBook = async (payload) => {
  const response = await api.post('/borrow-book', payload);
  return response.data;
};

export const returnBook = async (payload) => {
  const response = await api.post('/return-book', payload);
  return response.data;
};

// Dashboard APIs
export const getDashboard = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export const getOverdueTransactions = async () => {
  const response = await api.get('/transactions/overdue');
  return response.data;
};

// Reports APIs
export const getTopBorrowedBooks = async () => {
  const response = await api.get('/reports/top-borrowed');
  return response.data;
};

export const getActiveFines = async () => {
  const response = await api.get('/reports/active-fines');
  return response.data;
};

export const getBorrowingStudents = async () => {
  const response = await api.get('/students/borrowers');
  return response.data;
};

export const seedDemoData = async () => {
  const response = await api.post('/demo/seed-demo');
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};

export const getStudentById = async (id) => {
  const response = await api.get(`/students/${id}`);
  return response.data;
};
