import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Search,
  Filter,
  DownloadCloud,
  UploadCloud,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckSquare,
  Square,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
  Calendar
} from 'lucide-react';

const UserManagementTable = ({ role }) => {
  // Data State
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [exportError, setExportError] = useState('');

  // Filter State
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('Newest First');
  const [dateRangeFilter, setDateRangeFilter] = useState('All Time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [customLimit, setCustomLimit] = useState('');

  // Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  
  // UI State
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, departmentFilter, statusFilter, sortFilter, dateRangeFilter, customStartDate, customEndDate, page, limit, role]);

  const fetchDepartments = async () => {
    // Assuming departments can be statically mapped or fetched if an endpoint exists.
    // We'll use the static list based on valid departments
    setDepartments([
      'COMPUTER ENGINEERING DEPARTMENT',
      'INFORMATION TECHNOLOGY DEPARTMENT',
      'CIVIL DEPARTMENT',
      'MECHANICAL DEPARTMENT',
      'AUTOMOBILE DEPARTMENT',
      'EC DEPARTMENT',
      'ELECTRICAL DEPARTMENT'
    ]);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        role,
        page,
        limit,
        search,
        department: departmentFilter,
        status: statusFilter,
        sort: sortFilter,
        dateRange: dateRangeFilter !== 'All Time' ? dateRangeFilter : undefined
      };
      
      if (dateRangeFilter === 'Custom Date') {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const res = await axios.get('/api/users', { params });
      if (res.data.success) {
        setUsers(res.data.users);
        setTotalUsers(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(users.map(u => u._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = async (action, value = null) => {
    if (selectedIds.length === 0) return alert('No users selected');
    if (!window.confirm(`Are you sure you want to perform: ${action} on ${selectedIds.length} users?`)) return;

    try {
      const res = await axios.post('/api/users/bulk-action', {
        userIds: selectedIds,
        action,
        value
      });
      if (res.data.success) {
        alert(res.data.message);
        setSelectedIds([]);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const triggerExport = async () => {
    try {
      setIsExporting(true);
      setExportError('');
      setExportMessage('Downloading...');
      
      const res = await axios.get(`/api/users/export?role=${role}`, {
        responseType: 'blob'
      });
      
      if (res.data.size === 0) {
        setExportMessage('');
        setExportError('No data available to export.');
        setTimeout(() => setExportError(''), 3000);
        return;
      }
      
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let filename = `EventHuB_${role}s.xlsx`;
      const disposition = res.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/["']/g, '');
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setExportMessage(`${role} data downloaded successfully.`);
      setTimeout(() => setExportMessage(''), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      setExportMessage('');
      setExportError('Failed to download data. Please try again.');
      setTimeout(() => setExportError(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = Math.ceil(totalUsers / limit);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Manage {role}s</h1>
          <p className="mt-1 text-sm text-slate-500">View, search, import, and manage {role.toLowerCase()} accounts efficiently.</p>
        </div>
        <div className="flex items-center gap-3 relative">
          <button
            onClick={triggerExport}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50 transition-opacity"
          >
            {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
            <span>{isExporting ? 'Downloading...' : 'Download Data'}</span>
          </button>
          
          {/* Export Toast */}
          {(exportMessage || exportError) && (
            <div className={`absolute top-full right-0 mt-2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-bold border whitespace-nowrap ${
              exportError ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              {exportError || exportMessage}
            </div>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col xl:flex-row gap-4 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3 h-10 w-8 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${role.toLowerCase()}...`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full sm:w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Blocked">Blocked</option>
          </select>

          <select
            value={sortFilter}
            onChange={(e) => setSortFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none"
          >
            <option value="Newest First">Newest First</option>
            <option value="Oldest First">Oldest First</option>
            <option value="Name A-Z">Name A-Z</option>
            <option value="Name Z-A">Name Z-A</option>
          </select>

          <select
            value={dateRangeFilter}
            onChange={(e) => { setDateRangeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none"
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Custom Date">Custom Date</option>
          </select>

          {dateRangeFilter === 'Custom Date' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="rounded-lg border border-slate-200 p-1.5 text-sm" />
              <span>-</span>
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="rounded-lg border border-slate-200 p-1.5 text-sm" />
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-bold text-blue-700">{selectedIds.length} users selected</span>
          <div className="flex items-center gap-2">
            <button onClick={() => handleBulkAction('Activate')} className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-emerald-700">Activate</button>
            <button onClick={() => handleBulkAction('Deactivate')} className="bg-amber-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-amber-700">Deactivate</button>
            <button onClick={() => handleBulkAction('Delete')} className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-700">Delete</button>
            
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkAction('Change Department', e.target.value);
                  e.target.value = '';
                }
              }}
              className="ml-2 rounded-md border border-blue-300 bg-white px-2 py-1.5 text-xs font-bold text-blue-700 focus:outline-none"
            >
              <option value="">Change Dept...</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    onChange={handleSelectAll}
                    checked={users.length > 0 && selectedIds.length === users.length}
                  />
                </th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">{role === 'Student' ? 'Enrollment' : role === 'Faculty' ? 'Employee ID' : 'Username'}</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="text-lg font-bold text-slate-900">No Users Found</p>
                      <p className="text-sm mt-1">Try changing filters or import new accounts.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.includes(user._id)}
                        onChange={() => handleSelectOne(user._id)}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-700">{user.department}</td>
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-slate-900">
                      {role === 'Student' ? user.enrollmentNumber : role === 'Faculty' ? user.employeeId : user.username || 'N/A'}
                    </td>
                    <td className="px-6 py-3 text-xs">{user.contactNumber}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                        ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          user.status === 'Blocked' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => window.location.href = `/admin/user/${user._id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit Profile">
                          <MoreVertical className="h-4 w-4" /> {/* Or Edit2 icon, but MoreVertical works or we can import Edit */}
                        </button>
                        {user.status !== 'Active' ? (
                          <button onClick={() => { setSelectedIds([user._id]); handleBulkAction('Activate'); }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Activate">
                            <UserCheck className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => { setSelectedIds([user._id]); handleBulkAction('Deactivate'); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Deactivate">
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => { setSelectedIds([user._id]); handleBulkAction('Delete'); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-semibold text-slate-500">
            Showing <span className="font-bold text-slate-900">{totalUsers === 0 ? 0 : (page - 1) * limit + 1}</span> to <span className="font-bold text-slate-900">{Math.min(page * limit, totalUsers)}</span> of <span className="font-bold text-slate-900">{totalUsers}</span> Users
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Rows:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="rounded border border-slate-200 px-2 py-1 text-xs font-semibold bg-white"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <input
                type="number"
                placeholder="Custom"
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
                onBlur={() => { if (customLimit) { setLimit(Number(customLimit)); setPage(1); } }}
                className="w-16 rounded border border-slate-200 px-2 py-1 text-xs text-center font-semibold bg-white placeholder-slate-400 focus:outline-blue-500"
              />
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50">
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="px-2 text-xs font-bold text-slate-700">
                {page} / {totalPages || 1}
              </span>

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50">
                <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50">
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal Removed */}
    </div>
  );
};

export default UserManagementTable;
