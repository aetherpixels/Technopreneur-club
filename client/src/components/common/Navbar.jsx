import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getFullAssetUrl } from '../../config/api';
import { Menu, LogOut, UserSquare2, ChevronDown, ShieldCheck, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProfilePath = () => {
    if (user?.role === 'Admin') return '/admin/profile';
    if (user?.role === 'Faculty') return '/faculty/profile';
    return '/student/profile';
  };

  return (
    <nav className="fixed top-0 left-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section: Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            type="button"
            className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white md:hidden cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative overflow-hidden rounded-xl bg-white p-0.5 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-transform duration-300 group-hover:scale-105">
              <img 
                src="/logo.jpg" 
                alt="Event-HuB Logo" 
                className="h-9 w-9 object-cover rounded-lg"
              />
            </div>
            <span className="font-heading text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center">
              Event<span className="text-blue-600 dark:text-blue-400 font-bold">-</span><span className="text-purple-600 dark:text-purple-400">HuB</span>
            </span>
          </Link>
        </div>

        {/* Right Section: Top-Right Profile Avatar & Dropdown */}
        {user && (
          <div className="flex items-center gap-4">
            <span className="hidden text-xs font-bold text-slate-400 dark:text-slate-400 lg:inline-block">
              Institutional Activities Portal
            </span>

            {/* Top-Right Profile Menu Dropdown Container */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
              >
                {user.profilePhoto ? (
                  <img
                    src={getFullAssetUrl(user.profilePhoto)}
                    alt={user.name}
                    className="h-8 w-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                  </div>
                )}

                <div className="hidden sm:flex flex-col text-left pr-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>

                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Card */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-3 z-50 animate-fadeIn font-sans">
                  {/* User Profile Info Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    {user.profilePhoto ? (
                      <img
                        src={getFullAssetUrl(user.profilePhoto)}
                        alt={user.name}
                        className="h-10 w-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                        {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="overflow-hidden min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-extrabold uppercase border border-purple-500/20">
                        <ShieldCheck className="h-2.5 w-2.5" /> {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Links & Actions */}
                  <div className="space-y-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {/* My Profile Link */}
                    <Link
                      to={getProfilePath()}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <UserSquare2 className="h-4 w-4 text-blue-500" />
                      <span>My Profile</span>
                    </Link>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/20 transition-all cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
