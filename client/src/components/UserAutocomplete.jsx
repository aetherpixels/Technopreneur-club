import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, X, Loader2 } from 'lucide-react';

const UserAutocomplete = ({ 
  role, 
  value, 
  onChange, 
  placeholder = "Search user...",
  label = "User",
  required = false
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!query.trim() || selectedUser) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/users/search?q=${query}&role=${role || ''}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data.success) {
          setResults(res.data.users);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, role, selectedUser]);

  const handleSelect = (user) => {
    setSelectedUser(user);
    setQuery(user.name);
    setIsOpen(false);
    onChange(user._id, user);
  };

  const handleClear = () => {
    setSelectedUser(null);
    setQuery('');
    onChange(null, null);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            if (selectedUser) {
              setSelectedUser(null);
              onChange(null);
            }
            setQuery(e.target.value);
          }}
          required={required && !selectedUser}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute inset-y-0 right-8 pr-3 flex items-center pointer-events-none">
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          </div>
        )}
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={handleClear}>
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {results.map((user) => (
            <li
              key={user._id}
              onClick={() => handleSelect(user)}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 group border-b border-gray-100 last:border-0"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900 group-hover:text-blue-600 block truncate">
                  {user.name}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {user.department}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5 flex space-x-2 truncate">
                {user.enrollmentNumber ? (
                  <span className="font-mono">{user.enrollmentNumber}</span>
                ) : user.employeeId ? (
                  <span className="font-mono">{user.employeeId}</span>
                ) : null}
                <span>•</span>
                <span className="truncate">{user.email}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {isOpen && results.length === 0 && query.trim() !== '' && !loading && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-2 px-3 text-sm text-gray-500">
          No users found.
        </div>
      )}
    </div>
  );
};

export default UserAutocomplete;
