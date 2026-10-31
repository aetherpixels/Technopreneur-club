import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  BookOpen, 
  Hash, 
  ArrowRight, 
  Sparkles,
  Sun,
  Moon,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [department, setDepartment] = useState('IT');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 8) {
      return setError('Password must be at least 8 characters long');
    }

    setLoading(true);
    const result = await register(
      name,
      email,
      password,
      department,
      contactNumber,
      enrollmentNumber
    );
    setLoading(false);

    if (result.success) {
      setSuccess(result.message || 'Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-slate-100 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      {/* Ambient Background Glowing Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-blue-600/20 dark:bg-blue-600/15 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 dark:bg-indigo-600/15 blur-[140px] pointer-events-none animate-pulse-glow" />


      {/* Main Dual-Panel Container */}
      <div className="relative w-full max-w-5xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[650px] animate-fadeIn z-10">
        
        {/* Left Hero Brand Panel (Blue Gradient & Graphics) */}
        <div className="lg:col-span-5 relative bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-900 text-white p-8 md:p-10 flex flex-col justify-between overflow-hidden">
          {/* Decorative Floating Shapes */}
          <div className="absolute top-[-30px] left-[-30px] w-48 h-48 rounded-full border-4 border-white/10 animate-float-slow pointer-events-none" />
          <div className="absolute bottom-[-20px] right-[-20px] w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1 border border-white/30 shadow-lg shadow-indigo-900/40 transform hover:scale-105 transition-transform">
              <img src="/logo.jpg" alt="Event-HuB Logo" className="h-full w-full object-cover rounded-xl" />
            </div>
            <div>
              <span className="font-heading text-2xl font-black tracking-tight text-white block leading-none">
                Event<span className="text-blue-300">-</span>HuB
              </span>
              <span className="text-[10px] uppercase tracking-widest text-blue-200 font-semibold">Student Registration</span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 my-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-100 text-xs font-medium border border-white/15">
              <GraduationCap className="h-4 w-4 text-amber-300" />
              <span>Join Your Department Portal</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white font-heading leading-tight">
              Create Your Student Account
            </h2>
            <p className="text-sm text-blue-100/90 leading-relaxed font-normal">
              Register with your enrollment details to sign up for department activities, manage attendance, and generate verified certificates.
            </p>

            {/* Checklist */}
            <div className="pt-2 space-y-2 text-xs text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Instant access to upcoming workshops & events</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Track attendance & download completion certificates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Direct profile integration with department records</span>
              </div>
            </div>
          </div>

          {/* Switch to Login Button */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex flex-col gap-3">
            <p className="text-xs text-blue-100">Already registered your account?</p>
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 hover:bg-white/20 backdrop-blur-md py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] shadow-sm"
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right Form Panel (Register Inputs) */}
        <div className="lg:col-span-7 p-6 md:p-10 flex flex-col justify-center bg-white dark:bg-slate-900 transition-colors duration-200">
          <div className="max-w-lg mx-auto w-full">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
                Student Sign Up
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Fill out the required information below
              </p>
            </div>

            {/* Notifications */}
            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2 animate-fadeIn">
                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@student.edu"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Enrollment Number */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Enrollment No.
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Hash className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={enrollmentNumber}
                      onChange={(e) => setEnrollmentNumber(e.target.value)}
                      placeholder="19012011001"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="9876543210"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Department Select */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="CE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Computer Engineering (CE)</option>
                    <option value="IT" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Information Technology (IT)</option>
                    <option value="CIVIL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Civil Engineering (CIVIL)</option>
                    <option value="MECH" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Mechanical Engineering (MECH)</option>
                    <option value="EC" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Electronics & Communication (EC)</option>
                    <option value="EE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Electrical Engineering (EE)</option>
                    <option value="AUTO" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Automobile Engineering (AUTO)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400 lg:hidden">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
