import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, UserPlus, Check, X, ArrowLeft, Users, CheckCircle, ShieldAlert } from 'lucide-react';
import UserAutocomplete from '../../components/UserAutocomplete';

const Attendance = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Local list of attendance states (map of studentId -> 'Present'/'Absent'/'Pending')
  const [attendanceMap, setAttendanceMap] = useState({});

  // Manual entry states
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedOfflineStudent, setSelectedOfflineStudent] = useState(null);

  const [alert, setAlert] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);

  const fetchEventData = async () => {
    try {
      // Verify certificate is configured first
      const configRes = await axios.get(`/api/certificates/config/${eventId}`);
      if (!configRes.data.success || !configRes.data.configExists) {
        alert('Certificate setup is required before you can mark attendance.');
        navigate(`/faculty/certificate-setup/${eventId}`);
        return;
      }

      const eventRes = await axios.get(`/api/events/${eventId}`);
      const regsRes = await axios.get(`/api/registrations/event/${eventId}`);
      
      if (eventRes.data.success && regsRes.data.success) {
        setEvent(eventRes.data.event);
        const regs = regsRes.data.registrations || [];
        setRegistrations(regs);
        
        // Initialize local map with DB states
        const initialMap = {};
        regs.forEach(r => {
          initialMap[r.student._id] = r.attendanceStatus === 'Pending' ? 'Absent' : r.attendanceStatus; // default to absent for rapid check-in
        });
        setAttendanceMap(initialMap);
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'danger', message: 'Failed to load event registration details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const toggleAttendance = (studentId) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const handleAddManual = (e) => {
    e.preventDefault();
    if (!selectedOfflineStudent) return;
    
    // Check if already in registrations
    if (registrations.some(r => r.student._id === selectedOfflineStudent._id)) {
      setAlert({ type: 'danger', message: 'Student is already registered. Please search in the list.' });
      setShowManualModal(false);
      setSelectedOfflineStudent(null);
      return;
    }

    const newReg = {
      _id: 'temp_' + Date.now(),
      student: selectedOfflineStudent,
      status: 'Registered',
      attendanceStatus: 'Present',
      customResponses: []
    };

    setRegistrations([newReg, ...registrations]);
    setAttendanceMap(prev => ({ ...prev, [selectedOfflineStudent._id]: 'Present' }));
    
    // Reset
    setSelectedOfflineStudent(null);
    setShowManualModal(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setAlert({ type: '', message: '' });

    // Format local map to controller payload list
    const formattedAttendance = Object.keys(attendanceMap).map(studentId => ({
      studentId,
      status: attendanceMap[studentId]
    }));

    try {
      const res = await axios.post(`/api/registrations/attendance/${eventId}`, {
        attendance: formattedAttendance
      });

      if (res.data.success) {
        setAlert({ type: 'success', message: 'Attendance records saved successfully!' });
        fetchEventData();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  };

  // Stats calculation
  const registeredCount = registrations.length;
  const presentCount = Object.values(attendanceMap).filter(v => v === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter(v => v === 'Absent').length;

  const filteredRegistrations = registrations.filter(r => 
    r.student.name.toLowerCase().includes(search.toLowerCase()) || 
    r.student.enrollmentNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/faculty/manage-events')}
            className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Attendance Sheet</h1>
            <p className="text-sm text-slate-500">Record check-ins for: <strong className="text-slate-800 font-semibold">{event?.title}</strong></p>
          </div>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Offline Attendee</span>
        </button>
      </div>

      {alert.message && (
        <div className={`rounded-lg p-3 text-sm border ${
          alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {alert.message}
        </div>
      )}

      {/* Stats Counter Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered</p>
            <p className="text-2xl font-bold text-slate-900">{registeredCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Count</p>
            <p className="text-2xl font-bold text-slate-900">{presentCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-lg bg-red-50 p-3 text-red-600">
            <X className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Absent Count</p>
            <p className="text-2xl font-bold text-slate-900">{absentCount}</p>
          </div>
        </div>
      </div>



      {/* Main Registrations Grid */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Search */}
        <div className="border-b border-slate-100 p-4">
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3 h-10 w-8 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by name or enrollment number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Table layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b">
              <tr>
                <th className="px-6 py-4">Enrollment Number</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Additional Info</th>
                <th className="px-6 py-4 text-center">Status Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">No matching student registrations found.</td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => {
                  const isPresent = attendanceMap[reg.student._id] === 'Present';
                  return (
                    <tr key={reg._id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900">{reg.student.enrollmentNumber}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{reg.student.name}</div>
                        <div className="text-xs text-slate-400">{reg.student.email}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{reg.student.department}</td>
                      <td className="px-6 py-4 text-xs">
                        {reg.customResponses && reg.customResponses.length > 0 ? (
                          <div className="space-y-1 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 max-w-xs">
                            {reg.customResponses.map((cr, idx) => (
                              <div key={idx} className="line-clamp-2">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{cr.questionText}: </span>
                                <span className="text-slate-600 dark:text-slate-400">
                                  {Array.isArray(cr.answer) ? cr.answer.join(', ') : String(cr.answer)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => toggleAttendance(reg.student._id)}
                            className={`flex h-8 w-20 items-center justify-center gap-1 rounded-full text-xs font-bold transition-all ${
                              isPresent 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm' 
                                : 'bg-red-50 text-red-800 border border-red-100'
                            }`}
                          >
                            {isPresent ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Present</span>
                              </>
                            ) : (
                              <>
                                <X className="h-3.5 w-3.5" />
                                <span>Absent</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button Footer bar */}
      <div className="flex items-center justify-end border-t pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-50 transition-all"
        >
          {saving ? 'Saving changes...' : 'Save Attendance Records'}
        </button>
      </div>

      {/* Manual Add Dialog Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Add Offline Attendee</h2>
            <form onSubmit={handleAddManual} className="mt-4 space-y-4">
              <div className="min-h-[250px]">
                <UserAutocomplete
                  role="Student"
                  value={selectedOfflineStudent?._id || ''}
                  onChange={(id, user) => setSelectedOfflineStudent(user)}
                  placeholder="Search and select a student..."
                  label="Select Student"
                  required={true}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedOfflineStudent}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  Add Attendee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
