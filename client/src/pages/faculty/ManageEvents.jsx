import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search,
  CalendarDays,
  MapPin,
  Users,
  Award,
  PlayCircle,
  Layers,
  Plus,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  UserCheck,
  ClipboardList
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getFullAssetUrl } from '../../config/api';

const ManageEvents = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Attendance Sub-Event Selection Modal
  const [attendanceModalFest, setAttendanceModalFest] = useState(null);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      const eventsRes = await axios.get('/api/events/my-events');
      const festRes = await axios.get('/api/festivals');

      if (eventsRes.data.success) {
        setEvents(eventsRes.data.events || []);
      }
      if (festRes.data.success) {
        setFestivals(festRes.data.festivals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyData();
  }, []);

  const handleCompleteEvent = async (id) => {
    if (!window.confirm('Mark this event as Completed? This will close registration.')) return;
    try {
      const res = await axios.patch(`/api/events/${id}/status`, { status: 'Completed' });
      if (res.data.success) {
        fetchMyData();
      }
    } catch (err) {
      console.error('Failed to complete event:', err);
    }
  };

  const handleCompleteFestival = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Mark this Multi Event as Completed? All sub-events will also be marked completed.')) return;
    try {
      const res = await axios.patch(`/api/festivals/${id}/status`, { status: 'Completed' });
      if (res.data.success) {
        fetchMyData();
      }
    } catch (err) {
      console.error('Failed to complete multi event:', err);
    }
  };

  const handleDeleteEvent = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you absolutely sure you want to delete this event? This action is permanent.')) return;
    try {
      const res = await axios.delete(`/api/events/${id}`);
      if (res.data.success) {
        fetchMyData();
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleDeleteFestival = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this multi event? All sub-events will lose their reference.')) return;
    try {
      const res = await axios.delete(`/api/festivals/${id}`);
      if (res.data.success) {
        fetchMyData();
      }
    } catch (err) {
      console.error('Failed to delete festival:', err);
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

  // Filter out events that belong to a festival so we don't duplicate them in the main view
  const standaloneEvents = events.filter((e) => !e.festival);

  // Combine Standalone Events & Event Groups into one list
  const combinedItems = [
    ...standaloneEvents.map(e => ({ ...e, isFestival: false, title: e.title, banner: e.poster, date: e.date, id: e._id })),
    ...festivals.map(f => ({ ...f, isFestival: true, title: f.name, banner: f.banner, date: f.startDate, id: f._id }))
  ];

  // Sort by date (newest first)
  combinedItems.sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredItems = combinedItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.venue && item.venue.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus =
      statusFilter === ''
        ? true
        : statusFilter === 'Completed'
        ? item.status === 'Completed'
        : item.status !== 'Completed';

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
            Manage Campus Events
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Publish single activities, launch multi-event activities, track attendance, and manage student registrations.
          </p>
        </div>

        <Link
          to="/faculty/create-event"
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer hover:scale-105 shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>+ Create Event</span>
        </Link>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Displaying {filteredItems.length} Unified Records
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute inset-y-0 left-0 pl-3 h-9 w-8 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-4 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-955 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active / Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Main Unified Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-bold">Loading dashboard logs...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center text-slate-400 border border-slate-200 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900">
          No records matching the filter criteria found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const displayBanner = item.banner ? getFullAssetUrl(item.banner) : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';

            return (
              <div
                key={item.id + (item.isFestival ? '-fest' : '-event')}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all relative"
              >
                {/* Banner & Label */}
                <div className="relative h-44 bg-slate-950">
                  <img
                    src={displayBanner}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500 opacity-90"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
                    }}
                  />
                  <span
                    className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm ${
                      item.status === 'Completed' ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}
                  >
                    {item.status}
                  </span>

                  <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider text-white ${item.isFestival ? 'border border-purple-500/50' : 'border border-blue-500/50'}`}>
                    {item.isFestival ? 'Event Group' : 'Single Event'}
                  </span>
                </div>

                {/* Body Meta */}
                <div className="flex-1 p-5 space-y-4">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {item.isFestival ? `${item.theme || 'Event Group'}` : `${item.type}`}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      <span>
                        {item.isFestival
                          ? `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}`
                          : new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{item.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>
                        {item.isFestival
                          ? `${item.totalEvents || 0} Sub-Events activities`
                          : `${item.registrationCount || 0} Registered`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex flex-col border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {item.status !== 'Completed' ? (
                      <button
                        onClick={(e) => item.isFestival ? handleCompleteFestival(item.id, e) : handleCompleteEvent(item.id)}
                        className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer shadow-sm"
                      >
                        <PlayCircle className="h-4 w-4" />
                        <span>Complete</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                        <Award className="h-4 w-4 animate-pulse" />
                        Completed
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(item.isFestival ? `/faculty/create-event?editFestivalId=${item.id}` : `/faculty/create-event?editEventId=${item.id}`)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-600 transition-colors"
                        title="Edit event details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => item.isFestival ? handleDeleteFestival(item.id, e) : handleDeleteEvent(item.id, e)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-red-500 hover:text-red-500 transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {item.isFestival ? (
                    <button
                      onClick={() => setAttendanceModalFest(item)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-md transition-colors"
                    >
                      <Layers className="h-4 w-4" />
                      <span>Manage Attendance</span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => navigate(`/faculty/registrations/${item.id}`)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
                      >
                        <ClipboardList className="h-4 w-4" />
                        <span>Registrations</span>
                      </button>
                      <button
                        onClick={() => handleMarkAttendanceClick(item.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>Mark Attendance</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-Events Attendance Picker Modal */}
      {attendanceModalFest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-850">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white font-heading">
                  {attendanceModalFest.name} Sub-Events
                </h3>
                <p className="text-xs text-slate-500">Select a sub-event activity to view and mark registrations & attendance</p>
              </div>
              <button
                type="button"
                onClick={() => setAttendanceModalFest(null)}
                className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {attendanceModalFest.childEvents && attendanceModalFest.childEvents.length > 0 ? (
                attendanceModalFest.childEvents.map((sub, idx) => (
                  <div
                    key={sub._id || idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sub.title}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold mt-1">
                        <span><strong>Venue:</strong> {sub.venue}</span>
                        <span>•</span>
                        <span><strong>Date:</strong> {new Date(sub.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setAttendanceModalFest(null);
                          navigate(`/faculty/registrations/${sub._id}`);
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-md flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                      >
                        <ClipboardList className="h-4 w-4" />
                        <span>Registrations</span>
                      </button>
                      <button
                        onClick={() => {
                          setAttendanceModalFest(null);
                          handleMarkAttendanceClick(sub._id);
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-md flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>Attendance</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No sub-event activities found under this event.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEvents;
