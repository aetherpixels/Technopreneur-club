import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, CalendarDays, MapPin, Layers, FileBadge, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFullAssetUrl } from '../../config/api';

const CertificateSetupList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subEventModal, setSubEventModal] = useState(null);

  const fetchCompletedEvents = async () => {
    setLoading(true);
    try {
      const eventsRes = await axios.get('/api/events/my-events');
      const festRes = await axios.get('/api/festivals');

      if (eventsRes.data.success) {
        setEvents(eventsRes.data.events.filter(e => e.status === 'Completed') || []);
      }
      if (festRes.data.success) {
        setFestivals(festRes.data.festivals.filter(f => f.status === 'Completed') || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedEvents();
  }, []);

  const standaloneEvents = events.filter((e) => !e.festival);

  const combinedItems = [
    ...standaloneEvents.map(e => ({ ...e, isFestival: false, title: e.title, banner: e.poster, date: e.date, id: e._id })),
    ...festivals.map(f => ({ ...f, isFestival: true, title: f.name, banner: f.banner, date: f.startDate, id: f._id }))
  ];

  combinedItems.sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredItems = combinedItems.filter((item) => {
    return item.title.toLowerCase().includes(search.toLowerCase()) || 
           (item.venue && item.venue.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
          Certificate Setup
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Select a completed event to configure its certificate template.
        </p>
      </div>

      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-96">
        <Search className="h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search completed events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 font-bold">Loading completed events...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center text-slate-400 border border-slate-200 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900">
          No completed events found for certificate setup.
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
                <div className="relative h-40 bg-slate-950">
                  <img
                    src={displayBanner}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500 opacity-90"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
                    }}
                  />
                  <span className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm bg-emerald-600`}>
                    Completed
                  </span>
                  <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider text-white ${item.isFestival ? 'border border-purple-500/50' : 'border border-blue-500/50'}`}>
                    {item.isFestival ? 'Multi Event' : 'Single Event'}
                  </span>
                </div>

                <div className="flex-1 p-5 space-y-4">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h3>
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
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4">
                  {item.isFestival ? (
                    <button
                      onClick={() => setSubEventModal(item)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-md transition-colors"
                    >
                      <Layers className="h-4 w-4" />
                      <span>Select Sub-Event for Certificate</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/faculty/certificate-setup/${item.id}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
                    >
                      <FileBadge className="h-4 w-4" />
                      <span>Setup Certificate</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-850">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white font-heading">
                  {subEventModal.name} Sub-Events
                </h3>
                <p className="text-xs text-slate-500">Select a sub-event to configure its certificate template.</p>
              </div>
              <button
                onClick={() => setSubEventModal(null)}
                className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {subEventModal.childEvents && subEventModal.childEvents.length > 0 ? (
                subEventModal.childEvents.map((sub, idx) => (
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

                    <button
                      onClick={() => navigate(`/faculty/certificate-setup/${sub._id}`)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-md flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                    >
                      <FileBadge className="h-4 w-4" />
                      <span>Setup</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No sub-event activities found under this multi-event.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateSetupList;
