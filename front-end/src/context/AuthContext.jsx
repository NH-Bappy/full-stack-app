import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginAdmin, registerAdmin } from '../api/libraryApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('library_admin');
    const storedToken = localStorage.getItem('library_admin_token');
    
    if (storedAdmin && storedToken) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch (e) {
        localStorage.removeItem('library_admin');
        localStorage.removeItem('library_admin_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const data = await loginAdmin(username, password);
      const { token, admin: adminData } = data;
      
      localStorage.setItem('library_admin_token', token);
      localStorage.setItem('library_admin', JSON.stringify(adminData));
      setAdmin(adminData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      throw new Error(message);
    }
  };

  const register = async (username, password) => {
    try {
      const data = await registerAdmin(username, password);
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed. Username may be taken.';
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('library_admin_token');
    localStorage.removeItem('library_admin');
    setAdmin(null);
  };

  const value = {
    admin,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
