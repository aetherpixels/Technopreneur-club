import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFullAssetUrl } from '../../config/api';
import {
  Layers,
  Plus,
  Calendar,
  MapPin,
  Users,
  Copy,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  Building2,
  User,
  Ticket,
  ChevronRight,
  Loader2,
  Sparkles,
  ArrowLeft,
  FileCheck,
  ShieldCheck
} from 'lucide-react';

const FestivalDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [festival, setFestival] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [duplicatingId, setDuplicatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchFestivalDetails();
  }, [id]);

  const fetchFestivalDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/festivals/${id}`);
      if (res.data.success) {
        setFestival(res.data.festival);
      }
    } catch (err) {
      console.error('Failed to load festival dashboard:', err);
      setError('Could not load festival details.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendanceClick = async (eventId) => {
    try {
      const res = await axios.get(`/api/certificates/config/${eventId}`);
      if (res.data.success && res.data.configExists) {
        navigate(`/faculty/attendance/${eventId}`);
      } else {
        alert('Certificate setup is required before you can mark attendance.');
        navigate(`/faculty/certificate-setup/${eventId}`);
      }
    } catch (err) {
      console.error('Error verifying certificate config:', err);
      navigate(`/faculty/certificate-setup/${eventId}`);
    }
  };

  const handleDuplicateChildEvent = async (eventId) => {
    setDuplicatingId(eventId);
    try {
      const res = await axios.post(`/api/events/${eventId}/duplicate`);
      if (res.data.success) {
        fetchFestivalDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to duplicate event');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDeleteChildEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event from the festival?')) return;
    setDeletingId(eventId);
    try {
      const res = await axios.delete(`/api/events/${eventId}`);
      if (res.data.success) {
        fetchFestivalDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <Loader2 className="h-10 w-10 text-purple-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Loading Festival Dashboard...</p>
      </div>
    );
  }

  if (error || !festival) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-950/30 rounded-3xl border border-red-200 text-center text-sm text-red-600 font-medium">
        {error || 'Festival record not found.'}
      </div>
    );
  }

  const { stats, childEvents } = festival;
  const bannerUrl = festival.banner ? getFullAssetUrl(festival.banner) : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200';

  return (
    <div className="space-y-8 pb-12 font-sans animate-fadeIn">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <button
            onClick={() => navigate('/faculty/manage-events')}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Events Management
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
            <Layers className="h-4 w-4" />
            <span>Festival Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading mt-1">
            {festival.name}
          </h1>
        </div>

        {/* Primary Action: Add Child Event */}
        <button
          onClick={() => navigate(`/faculty/create-event?festivalId=${festival._id}`)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 text-xs font-bold shadow-lg shadow-purple-500/25 transition-all cursor-pointer hover:scale-105 shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>+ Add Child Event</span>
        </button>
      </div>

      {/* Festival Hero Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl border border-slate-800">
        <div className="absolute inset-0 z-0">
          <img src={bannerUrl} alt={festival.name} className="h-full w-full object-cover opacity-35 blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              {festival.theme || 'Institutional Festival'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">{festival.name}</h2>
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed line-clamp-2">{festival.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-purple-400" />
                {new Date(festival.startDate).toLocaleDateString()} - {new Date(festival.endDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-purple-400" />
                {festival.venue}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-purple-400" />
                Convener: {festival.overallFacultyCoordinator?.name || 'Faculty Office'}
              </span>
            </div>
          </div>

          <div className="h-32 w-48 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 shadow-2xl">
            <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      {/* Festival Analytics Dashboard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        {[
          { label: 'Total Events', val: stats?.totalEvents || 0, color: 'text-purple-600 dark:text-purple-400' },
          { label: 'Active Events', val: stats?.activeEvents || 0, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Completed', val: stats?.completedEvents || 0, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Upcoming', val: stats?.upcomingEvents || 0, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Total Regs', val: stats?.totalRegistrations || 0, color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Total Teams', val: stats?.totalTeams || 0, color: 'text-pink-600 dark:text-pink-400' },
          { label: 'Depts Participating', val: stats?.participatingDepartmentsCount || 1, color: 'text-teal-600 dark:text-teal-400' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
            <div className={`text-2xl font-black font-heading ${stat.color}`}>{stat.val}</div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Child Events Management Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
              Festival Child Events ({childEvents.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage all sub-events hosted under {festival.name}.
            </p>
          </div>

          <button
            onClick={() => navigate(`/faculty/create-event?festivalId=${festival._id}`)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 px-4 py-2 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Event</span>
          </button>
        </div>

        {/* Child Events Cards List */}
        {childEvents.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Layers className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Child Events Created Yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click "+ Add Child Event" above to create sub-events like Coding Challenge, Hackathons, or Cultural Competitions inside this festival.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {childEvents.map((evt) => (
              <div
                key={evt._id}
                className="flex flex-col rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Poster */}
                <div className="relative h-36 bg-slate-900">
                  <img
                    src={evt.poster ? getFullAssetUrl(evt.poster) : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}
                    alt={evt.title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-extrabold text-white border border-white/10">
                    {evt.type}
                  </span>
                  <span
                    className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white shadow-sm ${
                      evt.status === 'Published'
                        ? 'bg-emerald-600'
                        : evt.status === 'Completed'
                        ? 'bg-blue-600'
                        : 'bg-slate-700'
                    }`}
                  >
                    {evt.status}
                  </span>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 space-y-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">{evt.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {new Date(evt.date).toLocaleDateString()} ({evt.startTime})
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-semibold">Mode: <strong>{evt.registrationMode || 'Individual'}</strong></span>
                    <span className="font-semibold">Venue: {evt.venue}</span>
                  </div>
                </div>

                {/* Card Action Controls matching Prompt: Edit, Delete, Duplicate, View Registrations */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicateChildEvent(evt._id)}
                      disabled={duplicatingId === evt._id}
                      title="Duplicate Event"
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      {duplicatingId === evt._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>

                    <button
                      onClick={() => handleDeleteChildEvent(evt._id)}
                      disabled={deletingId === evt._id}
                      title="Delete Event"
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-red-500 hover:text-red-700 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleMarkAttendanceClick(evt._id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>View Regs</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FestivalDashboard;
