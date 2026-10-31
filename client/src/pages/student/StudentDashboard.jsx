import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarRange, CalendarCheck, Award, HelpCircle, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    registered: 0,
    attended: 0,
    certificates: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const regRes = await axios.get('/api/registrations/my-registrations');
        const certRes = await axios.get('/api/certificates');

        if (regRes.data.success && certRes.data.success) {
          const regs = regRes.data.registrations || [];
          setStats({
            registered: regs.length,
            attended: regs.filter((r) => r.attendanceStatus === 'Present').length,
            certificates: certRes.data.certificates?.length || 0
          });
        }
      } catch (err) {
        console.error('Failed to load student stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cardData = [
    { title: 'Registered Events', value: stats.registered, icon: CalendarRange, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', link: '/student/registered' },
    { title: 'Events Attended', value: stats.attended, icon: CalendarCheck, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', link: '/student/completed' },
    { title: 'Certificates Earned', value: stats.certificates, icon: Award, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400', link: '/student/certificates' }
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
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
          Discover institutional events, manage your registrations, download certificates, and view media galleries.
        </p>
      </div>

      {/* Stats Cards */}
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

      {/* Guidance Section */}
      <div className="rounded-3xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-blue-950 dark:text-blue-300 font-heading">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <span>How Event-HuB Works for You</span>
        </h2>
        <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
          <li className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
            <span>
              <strong>Browse & Discover:</strong> Check out <Link to="/student/upcoming" className="text-blue-600 dark:text-blue-400 underline font-bold">Upcoming Events</Link> to find single workshops, coding contests, or multi-event tech & cultural fests.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
            <span>
              <strong>Register Online:</strong> Click "Register Now" for Individual or Team participation before registration deadlines close.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
            <span>
              <strong>Attend Activity:</strong> Be present on the event date at the designated venue. Faculty organizers will mark your attendance.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">4</span>
            <span>
              <strong>Get Certified:</strong> Download your official, verified participation certificate from <Link to="/student/certificates" className="text-blue-600 dark:text-blue-400 underline font-bold">My Certificates</Link>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">5</span>
            <span>
              <strong>View & Download Media:</strong> Explore event photos and videos in the shared <Link to="/media" className="text-blue-600 dark:text-blue-400 underline font-bold">Media Gallery</Link> with 1-click bulk ZIP downloads.
            </span>
          </li>
        </ol>
      </div>

      {/* Quick Action Router Banner */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">Ready to participate in upcoming events?</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Explore workshops, sports weeks, and hackathons open for registration.</p>
        </div>

        <Link
          to="/student/upcoming"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all shrink-0 hover:scale-105"
        >
          <span>Explore Upcoming Events</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
