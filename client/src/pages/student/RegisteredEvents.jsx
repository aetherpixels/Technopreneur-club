import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarDays, MapPin, XCircle, Users, UserCheck } from 'lucide-react';

const RegisteredEvents = () => {
  // Primary Data States
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const regRes = await axios.get('/api/registrations/my-registrations');
      if (regRes.data.success) {
        setRegistrations(regRes.data.registrations || []);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancel = async (regId) => {
    if (!window.confirm('Are you sure you want to cancel your registration for this event?')) return;
    try {
      const res = await axios.post(`/api/registrations/${regId}/cancel`);
      if (res.data.success) {
        alert(res.data.message);
        fetchRegistrations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel registration');
    }
  };

  // Sort registrations by event date (newest first)
  const sortedRegistrations = [...registrations].sort((a, b) => {
    return new Date(b.event?.date || 0) - new Date(a.event?.date || 0);
  });

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
          My Registered Events
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track registration status, team details, venue locations, and attendance records for active signups.
        </p>
      </div>

      {/* Registrations List */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs font-bold text-slate-400">Loading registrations...</div>
        ) : sortedRegistrations.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs font-bold text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
            No registrations found. Explore upcoming events to sign up!
          </div>
        ) : (
          sortedRegistrations.map((reg) => {
            const isTeam = reg.registrationType === 'Team';
            const isPresent = reg.attendanceStatus === 'Present';
            const isAbsent = reg.attendanceStatus === 'Absent';

            return (
              <div
                key={reg._id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                      isTeam ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    }`}>
                      {isTeam ? <Users className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      <span>{reg.registrationType || 'Individual'} Reg.</span>
                    </span>

                    {/* Attendance Badge */}
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      isPresent ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : isAbsent ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}>
                      {isPresent ? 'Attendance: Present' : isAbsent ? 'Attendance: Absent' : 'Attendance: Pending'}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white line-clamp-1">
                    {reg.event?.title || 'Registered Activity'}
                  </h3>

                  {isTeam && reg.teamName && (
                    <p className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                      Team: {reg.teamName} ({reg.teamMembers?.length + 1 || 1} Members)
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-blue-500" />
                      <span>{reg.event?.date ? new Date(reg.event.date).toLocaleDateString() : 'N/A'} at {reg.event?.startTime || 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span>{reg.event?.venue || 'Campus Venue'}</span>
                    </div>
                  </div>
                </div>

                {/* Cancel Action if event is active */}
                {reg.event?.status !== 'Completed' && reg.event?.status !== 'Cancelled' && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => handleCancel(reg._id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 transition-all cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Cancel Registration</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RegisteredEvents;
