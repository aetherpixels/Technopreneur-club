import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, GraduationCap, CalendarDays, Award, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    facultyCount: 0,
    studentCount: 0,
    eventCount: 0,
    completedEvents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersRes = await axios.get('/api/users?limit=1000');
        const eventsRes = await axios.get('/api/events?limit=1000');

        if (usersRes.data.success && eventsRes.data.success) {
          const users = usersRes.data.users || [];
          const events = eventsRes.data.events || [];

          setStats({
            facultyCount: users.filter((u) => u.role === 'Faculty').length,
            studentCount: users.filter((u) => u.role === 'Student').length,
            eventCount: events.length,
            completedEvents: events.filter((e) => e.status === 'Completed').length
          });
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cardData = [
    { title: 'Faculty Members', value: stats.facultyCount, icon: Users, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', link: '/admin/faculty' },
    { title: 'Registered Students', value: stats.studentCount, icon: GraduationCap, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400', link: '/admin/students' },
    { title: 'Total Events', value: stats.eventCount, icon: CalendarDays, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400', link: '/faculty/manage-events' },
    { title: 'Completed Activities', value: stats.completedEvents, icon: Award, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', link: '/faculty/completed' }
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
          Administrator Control Panel
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Monitor system metrics, manage faculty & student accounts, and view global activity archives.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Admin Guidance Section */}
      <div className="rounded-3xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-blue-950 dark:text-blue-300 font-heading">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <span>System Administration Guidelines</span>
        </h2>

        <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
          <li className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
            <span>
              <strong>Manage Faculty Accounts:</strong> Navigate to <Link to="/admin/faculty" className="text-blue-600 dark:text-blue-400 underline font-bold">Manage Faculty</Link> to onboard new faculty members or assign employee IDs.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
            <span>
              <strong>Manage Student Accounts:</strong> Navigate to <Link to="/admin/students" className="text-blue-600 dark:text-blue-400 underline font-bold">Manage Students</Link> to inspect enrollment registries or activate accounts.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
            <span>
              <strong>Review Document & Media Repositories:</strong> Access the global <Link to="/faculty/documents" className="text-blue-600 dark:text-blue-400 underline font-bold">Document Library</Link> and <Link to="/media" className="text-blue-600 dark:text-blue-400 underline font-bold">Media Gallery</Link>.
            </span>
          </li>
        </ol>
      </div>

      {/* Quick Actions */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">User Account Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Quickly provision faculty or student credentials.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/admin/faculty"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-md transition-all hover:scale-105"
          >
            <span>Manage Faculty</span>
          </Link>
          <Link
            to="/admin/students"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <span>Manage Students</span>
          </Link>
          <Link
            to="/admin/admins"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-400 px-4 py-2.5 text-xs font-bold hover:bg-amber-100 transition-all"
          >
            <span>Manage Admins</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
