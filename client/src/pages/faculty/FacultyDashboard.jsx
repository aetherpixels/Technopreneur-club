import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarRange, CalendarPlus, Archive, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/events/my-events');
        if (response.data.success) {
          const events = response.data.events || [];
          setStats({
            totalEvents: events.length,
            upcomingEvents: events.filter((e) => e.status !== 'Completed').length,
            completedEvents: events.filter((e) => e.status === 'Completed').length
          });
        }
      } catch (err) {
        console.error('Failed to load faculty stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cardData = [
    { title: 'Total Events Organized', value: stats.totalEvents, icon: CalendarRange, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', link: '/faculty/manage-events' },
    { title: 'Active & Upcoming', value: stats.upcomingEvents, icon: CalendarPlus, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400', link: '/faculty/manage-events' },
    { title: 'Completed Archives', value: stats.completedEvents, icon: Archive, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400', link: '/faculty/completed' }
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Plan single events & multi-event activities, monitor registrations, record attendance, and archive documents.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {cardData.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              to={card.link}
              className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white font-heading">{card.value}</p>
                </div>
                <div className={`rounded-2xl p-3.5 ${card.color} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-6 w-6 stroke-[2]" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Guidelines Section */}
      <div className="rounded-3xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-blue-955 dark:text-blue-300 font-heading">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <span>Faculty Institutional Workflow Guide</span>
        </h2>

        <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
          <li className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
            <span>
              <strong>Create Single or Multi-Event Activities:</strong> Navigate to <Link to="/faculty/create-event" className="text-blue-600 dark:text-blue-400 underline font-bold">Create Event</Link> to publish single workshops or multi-track institutional events.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
            <span>
              <strong>Manage Active Signups:</strong> Track student registrations in real-time under <Link to="/faculty/manage-events" className="text-blue-600 dark:text-blue-400 underline font-bold">Manage Events</Link>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
            <span>
              <strong>Mark Attendance:</strong> On the event date, click "Attendance" to check off student participation.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">4</span>
            <span>
              <strong>Upload Event Media & Documents:</strong> Upload official permission letters, finance PDFs, meeting notes, and photo/video galleries post-event.
            </span>
          </li>
        </ol>
      </div>

      {/* Quick Action Router Banner */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">Ready to host an event?</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Launch single workshops or multi-event cultural & tech activities.</p>
        </div>

        <Link
          to="/faculty/create-event"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all shrink-0 hover:scale-105"
        >
          <CalendarPlus className="h-4 w-4" />
          <span>Create New Event</span>
        </Link>
      </div>
    </div>
  );
};

export default FacultyDashboard;
