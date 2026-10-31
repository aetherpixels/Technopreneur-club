import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, Mail, Phone, Calendar, Briefcase, Lock, Camera, 
  CheckCircle2, AlertCircle, Edit3, X, Save, Trash2, ArrowLeft 
} from 'lucide-react';
import { getFullAssetUrl } from '../../config/api';

const DEPARTMENTS = [
  'COMPUTER ENGINEERING DEPARTMENT',
  'INFORMATION TECHNOLOGY DEPARTMENT',
  'CIVIL DEPARTMENT',
  'MECHANICAL DEPARTMENT',
  'AUTOMOBILE DEPARTMENT',
  'EC DEPARTMENT',
  'ELECTRICAL DEPARTMENT'
];

const UserProfileEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    dob: '',
    department: '',
    enrollmentNumber: '',
    designation: '',
    email: '',
    contactNumber: '',
    status: 'Active',
    password: ''
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/users/${id}`);
      if (res.data.success) {
        const u = res.data.user;
        setUser(u);
        setFormData({
          name: u.name || '',
          gender: u.gender || '',
          dob: u.dob ? u.dob.split('T')[0] : '',
          department: u.department || 'COMPUTER ENGINEERING DEPARTMENT',
          enrollmentNumber: u.enrollmentNumber || '',
          designation: u.designation || '',
          email: u.email || '',
          contactNumber: u.contactNumber || '',
          status: u.status || 'Active',
          password: ''
        });
      }
    } catch {
      setError('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return setError('Please select a valid image file (JPG, PNG, JPEG)');
    }

    if (file.size > 5 * 1024 * 1024) {
      return setError('Image size should be less than 5MB');
    }

    setError('');
    setSuccess('');
    setPhotoUploading(true);

    const data = new FormData();
    data.append('file', file);

    try {
      const uploadRes = await axios.post('/api/media/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadRes.data?.fileUrl) {
        // Save to user
        await axios.put(`/api/users/${id}`, { profilePhoto: uploadRes.data.fileUrl });
        setSuccess('Profile picture updated successfully!');
        fetchUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = { ...formData };
    if (!payload.password) delete payload.password;

    try {
      const res = await axios.put(`/api/users/${id}`, payload);
      if (res.data.success) {
        setSuccess('User updated successfully');
        fetchUser();
        setIsEditing(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name}"?`)) {
      return;
    }
    try {
      await axios.delete(`/api/users/${id}`);
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-slate-600">User not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const isStudent = user.role === 'Student';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Users</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <div className="h-20 w-20 rounded-2xl bg-white border-2 border-white/40 overflow-hidden flex items-center justify-center shadow-lg">
                {user.profilePhoto ? (
                  <img
                    src={getFullAssetUrl(user.profilePhoto)}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-blue-500 text-white flex items-center justify-center text-3xl font-extrabold uppercase">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                )}
              </div>
              <label
                htmlFor="adminEditorPhoto"
                className="absolute -bottom-2 -right-2 p-1.5 bg-white text-blue-600 rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform"
                title="Change Photo"
              >
                <Camera className="h-4 w-4" />
              </label>
              <input
                type="file"
                id="adminEditorPhoto"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={photoUploading}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold font-heading">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-white/20 text-white border border-white/30">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1">{user.email}</p>
              <p className="text-xs text-blue-200 mt-0.5">{user.department}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-600 font-bold text-xs shadow-md hover:bg-blue-50 transition cursor-pointer"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit User</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  fetchUser();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/30 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDelete}
              className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-white transition cursor-pointer"
              title="Delete User"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  name="name"
                  required
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border ${
                    isEditing ? 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700'
                  } focus:outline-none`}
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                required
                disabled={!isEditing}
                value={formData.gender}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                  isEditing ? 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700'
                } focus:outline-none`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Date of Birth
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  type="date"
                  name="dob"
                  disabled={!isEditing}
                  value={formData.dob}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border ${
                    isEditing ? 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700'
                  } focus:outline-none`}
                />
              </div>
            </div>

            {/* Department */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                name="department"
                required
                disabled={!isEditing}
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                  isEditing ? 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700'
                } focus:outline-none`}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Student: Enrollment No */}
            {isStudent && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Enrollment No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="enrollmentNumber"
                  required
                  disabled={!isEditing}
                  value={formData.enrollmentNumber}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border ${
                    isEditing ? 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700'
                  } focus:outline-none`}
                />
              </div>
            )}

            {/* Faculty / Admin: Designation */}
            {!isStudent && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Designation <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="designation"
                    required
                    disabled={!isEditing}
                    value={formData.designation}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border ${
                      isEditing ? 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700'
                    } focus:outline-none`}
                  />
                </div>
              </div>
            )}

            {/* Email ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border ${
                    isEditing ? 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700'
                  } focus:outline-none`}
                />
              </div>
            </div>

            {/* Contact No */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Contact No <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  name="contactNumber"
                  required
                  disabled={!isEditing}
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border ${
                    isEditing ? 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700'
                  } focus:outline-none`}
                />
              </div>
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Status
              </label>
              <select
                name="status"
                disabled={!isEditing}
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                  isEditing ? 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700'
                } focus:outline-none`}
              >
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            {/* Optional Password Override (when editing) */}
            {isEditing && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Reset User Password (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep existing password"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  fetchUser();
                }}
                className="px-6 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserProfileEditor;
