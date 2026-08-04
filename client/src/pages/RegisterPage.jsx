import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, User, Phone, Briefcase, Activity, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function RegisterPage() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // 'checking', 'available', 'taken'
  const [phoneStatus, setPhoneStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const checkAvailability = async (field, value) => {
    if (!value) return;
    
    if (field === 'email') setEmailStatus('checking');
    if (field === 'phone') setPhoneStatus('checking');

    try {
      await axios.post('/api/auth/check-availability', { [field]: value });
      if (field === 'email') setEmailStatus('available');
      if (field === 'phone') setPhoneStatus('available');
    } catch (err) {
      if (err.response?.status === 400) {
        if (field === 'email') setEmailStatus('taken');
        if (field === 'phone') setPhoneStatus('taken');
      } else {
        if (field === 'email') setEmailStatus(null);
        if (field === 'phone') setPhoneStatus(null);
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'email' || name === 'phone') {
      checkAvailability(name, value);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, confirmPassword, role } = formData;

    if (!name || !email || !phone || !password || !confirmPassword || !role) {
      toast.error('Please enter all fields');
      return;
    }

    if (emailStatus === 'taken') {
      toast.error('Email is already registered. Please login.');
      return;
    }

    if (phoneStatus === 'taken') {
      toast.error('Phone number is already registered.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      toast.error('Password must contain both letters and numbers');
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const data = await register({ name, email, phone, password, confirmPassword, role });
      toast.success('Registration successful!');
      if (data.user.role === 'owner') navigate('/owner/dashboard');
      else navigate('/user/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-slate-900/60 border border-slate-800 p-8 rounded-2xl shadow-2xl glass-panel">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Activity className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Join PlaySpot</h2>
          <p className="mt-2 text-sm text-slate-400">
            Create an account to book fields or register your arena
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          
          {/* Full Name */}
          <div>
            <label className="sr-only">Full Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-slate-500" />
              </div>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                placeholder="Full Name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="sr-only">Email address</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`block w-full rounded-xl border ${emailStatus === 'taken' ? 'border-red-500' : emailStatus === 'available' ? 'border-emerald-500' : 'border-slate-800'} bg-slate-950/60 py-3 pl-10 pr-10 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm`}
                placeholder="Email Address"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {emailStatus === 'available' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                {emailStatus === 'taken' && <XCircle className="h-5 w-5 text-red-500" />}
              </div>
            </div>
            {emailStatus === 'taken' && <p className="mt-1 text-xs text-red-500 font-medium">This email is already registered.</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="sr-only">Phone Number</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Phone className="h-5 w-5 text-slate-500" />
              </div>
              <input
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`block w-full rounded-xl border ${phoneStatus === 'taken' ? 'border-red-500' : phoneStatus === 'available' ? 'border-emerald-500' : 'border-slate-800'} bg-slate-950/60 py-3 pl-10 pr-10 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm`}
                placeholder="Phone Number (10 digits)"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {phoneStatus === 'available' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                {phoneStatus === 'taken' && <XCircle className="h-5 w-5 text-red-500" />}
              </div>
            </div>
            {phoneStatus === 'taken' && <p className="mt-1 text-xs text-red-500 font-medium">This phone number is already registered.</p>}
          </div>

          {/* Role Selection */}
          <div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Briefcase className="h-5 w-5 text-slate-500" />
              </div>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-3 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm cursor-pointer"
              >
                <option value="user" className="bg-slate-950 text-slate-100">User (Player)</option>
                <option value="owner" className="bg-slate-950 text-slate-100">Ground Owner (Business)</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="sr-only">Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-10 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                placeholder="Password (Min. 6 chars)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-350 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="sr-only">Confirm Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-10 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                placeholder="Confirm Password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-350 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-emerald-500 py-3 px-4 text-sm font-bold text-slate-950 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition duration-150 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
              ) : (
                'Register Account'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-350">
              Log in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
