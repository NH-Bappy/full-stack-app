import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import { KeyRound, User, Lock, ArrowRight, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

const LoginView = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        const result = await register(username, password);
        setSuccess(result.message || 'Registration successful! Please login.');
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden px-4">
      {/* Decorative Indigo Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 flex items-center justify-center mb-3 animate-float">
            <img src={logo} alt="GGAI Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1">
            GGAI <span className="text-indigo-650 text-indigo-600">RFID</span>
          </h1>
          <p className="text-slate-500 text-sm">Govt. Graphic Arts Institute RFID Terminal</p>
        </div>

        {/* Auth Panel */}
        <div className="glass-panel rounded-3xl p-8 shadow-xl relative">
          <div className="absolute top-0 right-0 p-4">
            <Sparkles className="w-5 h-5 text-indigo-500/30" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            {isLogin ? 'Admin Sign In' : 'Register Admin'}
          </h2>

          {error && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-sm mb-6">
              <ShieldAlert className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-indigo-50 border border-indigo-150 border-indigo-100 rounded-xl p-4 text-indigo-700 text-sm mb-6">
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="e.g. admin"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
            {isLogin ? (
              <p>
                Need an admin account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError('');
                  }}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Create one here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                  }}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
