import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles,
  Sun,
  Moon,
  Calendar,
  Award,
  Users
} from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      setTimeout(() => {
        navigate('/');
      }, 300);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-slate-100 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      {/* Background Ambient Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-blue-600/20 dark:bg-blue-600/15 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 dark:bg-indigo-600/15 blur-[140px] pointer-events-none animate-pulse-glow" />


      {/* Main Dual-Panel Auth Card Container */}
      <div className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] animate-fadeIn z-10">
        
        {/* Left Hero Brand Overlay Panel (Vibrant & Animated Graphic Panel) */}
        <div className="lg:col-span-5 relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white p-8 md:p-10 flex flex-col justify-between overflow-hidden">
          {/* Decorative Background Geometric Shapes & Circles */}
          <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full border-4 border-white/10 animate-float-slow pointer-events-none" />
          <div className="absolute bottom-[-20px] left-[-20px] w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute top-1/2 left-[-30px] w-32 h-32 bg-blue-400/20 rounded-2xl rotate-45 blur-xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1 border border-white/30 shadow-lg shadow-blue-900/40 transform hover:scale-105 transition-transform">
              <img src="/logo.jpg" alt="Event-HuB Logo" className="h-full w-full object-cover rounded-xl" />
            </div>
            <div>
              <span className="font-heading text-2xl font-black tracking-tight text-white block leading-none">
                Event<span className="text-blue-300">-</span>HuB
              </span>
              <span className="text-[10px] uppercase tracking-widest text-blue-200 font-semibold">Institutional Activity Management</span>
            </div>
          </div>

          {/* Center Greeting & Hero Info */}
          <div className="relative z-10 my-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-100 text-xs font-medium border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Institutional Activity Management</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white font-heading leading-tight">
              Welcome Back!
            </h2>
            <p className="text-sm text-blue-100/90 leading-relaxed font-normal">
              Sign in to manage institutional events, upload documents, track attendance, and download certificates.
            </p>

            {/* Feature Mini Cards */}
            <div className="pt-4 grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-200" />
                <span className="text-[10px] font-semibold text-white block">Events</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-blue-200" />
                <span className="text-[10px] font-semibold text-white block">Attendance</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                <Award className="h-5 w-5 mx-auto mb-1 text-blue-200" />
                <span className="text-[10px] font-semibold text-white block">Certificates</span>
              </div>
            </div>
          </div>

          {/* Bottom Switch Button to Register */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex flex-col gap-3">
            <p className="text-xs text-blue-100">Don't have a student account yet?</p>
            <Link
              to="/register"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 hover:bg-white/20 backdrop-blur-md py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] shadow-sm"
            >
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right Form Panel (Sign In Form) */}
        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900 transition-colors duration-200">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
                Sign In to Your Account
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Enter your credentials to access the portal
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-2 animate-fadeIn">
                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@institution.edu"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 py-3 pl-11 pr-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Mobile Register Link */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400 lg:hidden">
              New Student?{' '}
              <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Create an Account
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
