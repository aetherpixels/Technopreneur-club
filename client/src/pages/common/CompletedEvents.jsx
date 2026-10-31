import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, CalendarDays, MapPin, Archive, FolderClosed, Image, Play, Download, Layers, Sparkles } from 'lucide-react';
import { getFullAssetUrl } from '../../config/api';

const CompletedEvents = () => {
  // LEVEL 1 Tab State: Standalone vs Festival Archives
  const [activeTab, setActiveTab] = useState('Standalone'); // 'Standalone' | 'Festivals'

  // Primary Data States
  const [allEvents, setAllEvents] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [selectedFestivalId, setSelectedFestivalId] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected Completed Event details modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  const fetchCompletedData = async () => {
    setLoading(true);
    try {
      const eventsRes = await axios.get('/api/events?status=Completed');
      const festRes = await axios.get('/api/festivals');

      if (eventsRes.data.success) {
        setAllEvents(eventsRes.data.events || []);
      }
      if (festRes.data.success) {
        const festList = festRes.data.festivals || [];
        setFestivals(festList);
        if (festList.length > 0) {
          setSelectedFestivalId(festList[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching archives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedData();
  }, []);

  // Filter Standalone Events vs Festival Child Events
  const standaloneEvents = useMemo(() => {
    return allEvents.filter((e) => !e.festival);
  }, [allEvents]);

  const unifiedCompletedList = useMemo(() => {
    const standalone = allEvents.filter((e) => !e.festival);
    const festItems = festivals.filter((f) => new Date(f.endDate) < new Date()).map((f) => ({ ...f, isFestival: true }));
    return [...standalone, ...festItems];
  }, [allEvents, festivals]);

  const filteredEvents = useMemo(() => {
    return unifiedCompletedList.filter((item) => {
      const titleText = item.isFestival ? item.name : item.title;
      const venueText = item.venue || '';
      return (
        titleText.toLowerCase().includes(search.toLowerCase()) ||
        venueText.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [unifiedCompletedList, search]);

  const openDetails = async (item) => {
    setSelectedEvent(item);
    setMediaLoading(true);
    setMediaList([]);

    try {
      let res;
      if (item.isFestival) {
        res = await axios.get(`/api/media/festival/${item._id}`);
      } else {
        res = await axios.get(`/api/media/event/${item._id}`);
      }
      if (res.data.success) {
        setMediaList(res.data.media || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMediaLoading(false);
    }
  };

  // Group media by category
  const documents = mediaList.filter((m) => m.fileType === 'Document');
  const photos = mediaList.filter((m) => m.fileType === 'Image');
  const videos = mediaList.filter((m) => m.fileType === 'Video');

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
          Completed Events Archive
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Access completed institutional activities, view official permission sheets, download reports and browse media galleries.
        </p>
      </div>

      {/* Filter Panel */}
      <div className="flex rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-0 pl-3.5 h-full w-8 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search completed events & festivals archive..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2 pl-10 pr-4 text-xs font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-600 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs font-bold text-slate-400">Loading archives...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs font-bold text-slate-400">
            No completed events or festivals found.
          </div>
        ) : (
          filteredEvents.map((item) => {
            const isFest = item.isFestival;
            const posterUrl = isFest
              ? (item.banner ? getFullAssetUrl(item.banner) : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800')
              : getFullAssetUrl(item.poster);
            const title = isFest ? item.name : item.title;
            const subtitle = isFest ? (item.theme || 'Multi Event Archive') : item.type;
            const dateStr = isFest
              ? `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}`
              : `Conducted: ${new Date(item.date).toLocaleDateString()}`;

            return (
              <div
                key={item._id}
                onClick={() => openDetails(item)}
                className={`flex flex-col overflow-hidden rounded-3xl border bg-white dark:bg-slate-900 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 ${
                  isFest ? 'border-purple-200 dark:border-purple-900' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="relative h-44 bg-slate-950">
                  <img
                    src={posterUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
                    }}
                  />
                  <span className={`absolute bottom-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md ${
                    isFest ? 'bg-purple-900/80 border border-purple-500' : 'bg-slate-900/80'
                  }`}>
                    {isFest ? 'Multi Event' : subtitle}
                  </span>
                </div>

                <div className="p-5 flex-1 space-y-4">
                  <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {title}
                  </h3>

                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-blue-500" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span>{item.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-5 py-3 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                  <span>View Resources</span>
                  <Archive className="h-4 w-4" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details Resource Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedEvent.isFestival ? selectedEvent.name : selectedEvent.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold mt-0.5">
                  {selectedEvent.isFestival ? (selectedEvent.theme || 'Multi Event') : selectedEvent.type} Archive
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <XButton />
              </button>
            </div>

            {mediaLoading ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">Loading resources...</div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Left side: Documents */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                    <FolderClosed className="h-4 w-4 text-blue-500" />
                    <span>Official Documents</span>
                  </h3>

                  {documents.length === 0 ? (
                    <p className="text-xs text-slate-400">No official documents uploaded yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {documents.map((doc) => (
                        <li key={doc._id} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50 dark:bg-slate-950 text-xs">
                          <div className="overflow-hidden pr-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.category}</p>
                            <p className="text-[10px] text-slate-400">PDF Document</p>
                          </div>
                          <a
                            href={getFullAssetUrl(doc.fileUrl)}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-white dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-blue-50 text-blue-600 shadow-sm shrink-0"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Right side: Photos & Videos Gallery */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                    <Image className="h-4 w-4 text-emerald-500" />
                    <span>Photo Gallery ({photos.length})</span>
                  </h3>
                  {photos.length === 0 ? (
                    <p className="text-xs text-slate-400">No photographs captured.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {photos.map((p) => (
                        <div key={p._id} className="group relative h-24 overflow-hidden rounded-xl bg-slate-950 shadow-sm border border-slate-200 dark:border-slate-800">
                          <img
                            src={getFullAssetUrl(p.fileUrl)}
                            alt="Gallery"
                            className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 pt-2 font-heading">
                    <Play className="h-4 w-4 text-amber-500" />
                    <span>Video Gallery ({videos.length})</span>
                  </h3>
                  {videos.length === 0 ? (
                    <p className="text-xs text-slate-400">No videos uploaded.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {videos.map((v) => (
                        <div key={v._id} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-black">
                          <video
                            src={getFullAssetUrl(v.fileUrl)}
                            controls
                            className="w-full h-32 object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const XButton = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export default CompletedEvents;
