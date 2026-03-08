import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Key, UserPlus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminRegister() {
  const { adminRegister } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminSecretKey: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password requirement checks for inline helper
  const pw = form.password || '';
  const lengthOk = pw.length >= 8 && pw.length <= 12;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.adminSecretKey) {
      toast.error('Please fill in all fields.');
      return;
    }
  // Password policy: 8-12 chars, must include upper+lower letters, numbers and special characters
  const strongPass = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
    if (form.password.length < 8 || form.password.length > 12 || !strongPass.test(form.password)) {
      toast.error('Password must be 8-12 characters and include uppercase and lowercase letters, numbers, and special characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await adminRegister(form.name, form.email, form.password, form.adminSecretKey);
      toast.success('Admin account created successfully!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Admin registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">XQuizzes Admin</h1>
          <p className="text-gray-400">Create a new administrator account</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Admin Registration</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Admin Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2.5 pr-10 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Inline helper / tooltip for password requirements */}
              <div className="mt-2 text-xs text-gray-300 space-y-1">
                <div className={`flex items-center gap-2 ${lengthOk ? 'text-green-400' : 'text-gray-500'}`}>
                  <Check className="w-3 h-3" />
                  <span>8–12 characters</span>
                </div>
                <div className={`flex items-center gap-2 ${hasUpper ? 'text-green-400' : 'text-gray-500'}`}>
                  <Check className="w-3 h-3" />
                  <span>At least one uppercase letter</span>
                </div>
                <div className={`flex items-center gap-2 ${hasLower ? 'text-green-400' : 'text-gray-500'}`}>
                  <Check className="w-3 h-3" />
                  <span>At least one lowercase letter</span>
                </div>
                <div className={`flex items-center gap-2 ${hasDigit ? 'text-green-400' : 'text-gray-500'}`}>
                  <Check className="w-3 h-3" />
                  <span>At least one number</span>
                </div>
                <div className={`flex items-center gap-2 ${hasSpecial ? 'text-green-400' : 'text-gray-500'}`}>
                  <Check className="w-3 h-3" />
                  <span>At least one special character</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Admin Secret Key
                </span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  className="w-full px-4 py-2.5 pr-10 bg-gray-700/50 border border-amber-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Enter the admin secret key"
                  value={form.adminSecretKey}
                  onChange={(e) => setForm({ ...form, adminSecretKey: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Contact your organization admin for the secret key
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Create Admin Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <p className="text-center text-sm text-gray-400">
              Already have an admin account?{' '}
              <Link
                to="/admin/login"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-gray-500">
          This portal is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}
