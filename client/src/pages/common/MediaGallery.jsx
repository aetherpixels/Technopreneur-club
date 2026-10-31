import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { getFullAssetUrl } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import {
  Image as ImageIcon,
  Film,
  Search,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Plus,
  Calendar,
  X,
  Play,
  Loader2,
  FolderDown
} from 'lucide-react';

const MediaGallery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary Data States
  const [events, setEvents] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [allMedia, setAllMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & Tab states
  const [activeTab, setActiveTab] = useState('Photos'); // 'Photos' | 'Videos'
  const [selectedEventId, setSelectedEventId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'

  // Master-Detail selected item state inside active event
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [showFullModal, setShowFullModal] = useState(false);

  // Bulk zip download state
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Fetch Events, Festivals, and Media
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const eventsRes = await axios.get('/api/events');
      const festRes = await axios.get('/api/festivals');
      const mediaRes = await axios.get('/api/media/all');

      if (eventsRes.data.success) {
        setEvents(eventsRes.data.events || []);
      }

      if (festRes.data.success) {
        setFestivals(festRes.data.festivals || []);
      }

      if (mediaRes.data.success) {
        const mediaItems = mediaRes.data.media || [];
        setAllMedia(mediaItems);
      }
    } catch (err) {
      console.error('Failed to load gallery data:', err);
      setError('Could not load event media. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const unifiedItemsWithMediaStats = useMemo(() => {
    // Single Events
    const singleItems = events.filter((e) => !e.festival).map((evt) => {
      const eventMedia = allMedia.filter((m) => m.event?._id === evt._id || m.event === evt._id);
      const photoCount = eventMedia.filter((m) => m.fileType === 'Image').length;
      const videoCount = eventMedia.filter((m) => m.fileType === 'Video').length;
      return {
        _id: evt._id,
        title: evt.title,
        subtitle: 'Single Event',
        date: evt.date,
        venue: evt.venue,
        banner: evt.poster,
        photoCount,
        videoCount,
        totalMedia: eventMedia.length,
        media: eventMedia
      };
    });

    // Multi Events
    const multiItems = festivals.map((fest) => {
      const festMedia = allMedia.filter((m) => m.festival?._id === fest._id || m.festival === fest._id);
      const photoCount = festMedia.filter((m) => m.fileType === 'Image').length;
      const videoCount = festMedia.filter((m) => m.fileType === 'Video').length;
      return {
        _id: fest._id,
        title: fest.name,
        subtitle: 'Multi Event',
        date: fest.startDate,
        venue: fest.venue,
        banner: fest.banner,
        photoCount,
        videoCount,
        totalMedia: festMedia.length,
        media: festMedia
      };
    });

    return [...singleItems, ...multiItems];
  }, [events, festivals, allMedia]);

  // Filtered Items List for Left Column
  const filteredItemsList = useMemo(() => {
    let result = [...unifiedItemsWithMediaStats];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
          (item.venue && item.venue.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return result;
  }, [unifiedItemsWithMediaStats, searchQuery, sortBy]);

  // Auto-select first item when list updates
  useEffect(() => {
    if (filteredItemsList.length > 0) {
      if (!filteredItemsList.some((e) => e._id === selectedEventId)) {
        setSelectedEventId(filteredItemsList[0]._id);
      }
    } else {
      setSelectedEventId('');
    }
  }, [filteredItemsList, selectedEventId]);

  // Selected Active Item Details
  const selectedItem = useMemo(() => {
    if (!selectedEventId) return filteredItemsList[0] || null;
    return unifiedItemsWithMediaStats.find((e) => e._id === selectedEventId) || filteredItemsList[0] || null;
  }, [selectedEventId, unifiedItemsWithMediaStats, filteredItemsList]);

  // Active Tab Media Items for Selected Item
  const currentItemMediaItems = useMemo(() => {
    if (!selectedItem) return [];
    const targetType = activeTab === 'Photos' ? 'Image' : 'Video';
    return (selectedItem.media || []).filter((m) => m.fileType === targetType);
  }, [selectedItem, activeTab]);

  useEffect(() => {
    setActiveMediaIndex(0);
  }, [selectedEventId, activeTab]);

  const activeMediaItem = currentItemMediaItems[activeMediaIndex] || null;

  // Navigation Handlers for Hero Viewer
  const handlePrevMedia = () => {
    if (currentItemMediaItems.length === 0) return;
    setActiveMediaIndex((prev) => (prev === 0 ? currentItemMediaItems.length - 1 : prev - 1));
  };

  const handleNextMedia = () => {
    if (currentItemMediaItems.length === 0) return;
    setActiveMediaIndex((prev) => (prev === currentItemMediaItems.length - 1 ? 0 : prev + 1));
  };

  // Bulk Zip Download
  const handleBulkDownloadZip = async () => {
    if (!selectedItem || currentItemMediaItems.length === 0) {
      return alert('No media files available to download.');
    }

    setIsZipping(true);
    setZipProgress(0);
    try {
      const zip = new JSZip();
      const sanitizedTitle = selectedItem.title.replace(/[^a-z0-9]/gi, '_');
      const folderName = `${sanitizedTitle}_${activeTab}`;
      const folder = zip.folder(folderName);

      for (let i = 0; i < currentItemMediaItems.length; i++) {
        const item = currentItemMediaItems[i];
        const fullUrl = getFullAssetUrl(item.fileUrl);

        try {
          const response = await fetch(fullUrl);
          const blob = await response.blob();
          const ext = item.fileUrl.split('.').pop() || (activeTab === 'Photos' ? 'jpg' : 'mp4');
          const filename = `${sanitizedTitle}_${activeTab}_${i + 1}.${ext}`;
          folder.file(filename, blob);
        } catch (fetchErr) {
          console.error(`Failed to download item ${i + 1}:`, fetchErr);
        }

        setZipProgress(Math.round(((i + 1) / currentItemMediaItems.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = `${sanitizedTitle}_${activeTab}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Zip creation error:', err);
      alert('Failed to generate Zip file for media download.');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  const canUpload = user?.role === 'Faculty' || user?.role === 'Admin';

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2 font-heading">
            Events Photos & Videos Gallery
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View event photos and videos.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() =>
              navigate(selectedEventId ? `/faculty/manage-media?eventId=${selectedEventId}` : '/faculty/manage-media')
            }
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700/50 px-5 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Upload Photos / Videos</span>
          </button>
        )}
      </div>

      {/* Control Bar: Photos/Videos Tabs & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('Photos')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'Photos'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Photos</span>
          </button>

          <button
            onClick={() => setActiveTab('Videos')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'Videos'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Film className="h-4 w-4" />
            <span>Videos</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-955 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600 cursor-pointer shadow-sm"
          >
            <option value="newest">Sort by : Newest First</option>
            <option value="oldest">Sort by : Oldest First</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event title..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-850 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-sm"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Loading Media Showcase...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-sm text-red-600 dark:text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* Main 2-Column Master-Detail Layout */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Items List */}
          <div className="lg:col-span-4 space-y-3">
            {filteredItemsList.length === 0 ? (
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                No events found.
              </div>
            ) : (
              filteredItemsList.map((item) => {
                const isSelected = selectedItem?._id === item._id;
                const posterUrl = item.banner ? getFullAssetUrl(item.banner) : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400';

                return (
                  <div
                    key={item._id}
                    onClick={() => setSelectedEventId(item._id)}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${isSelected
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-400 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                      }`}
                  >
                    <div className="h-16 w-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200/60 dark:border-slate-800">
                      <img src={posterUrl} alt={item.title} className="h-full w-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-955 dark:text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                        {item.title}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                        <span>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                      </p>
                      <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mt-1">
                        {item.photoCount} Photos • {item.videoCount} Videos
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT COLUMN: Selected Item Showcase */}
          <div className="lg:col-span-8 space-y-4">
            {selectedItem ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                      {selectedItem.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-indigo-500" />
                      <span>{currentItemMediaItems.length} Files</span>
                    </span>

                    <button
                      onClick={handleBulkDownloadZip}
                      disabled={isZipping || currentItemMediaItems.length === 0}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-105 shrink-0"
                    >
                      {isZipping ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Zipping ({zipProgress}%)</span>
                        </>
                      ) : (
                        <>
                          <FolderDown className="h-3.5 w-3.5" />
                          <span>Download Zip</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* HERO VIEWER */}
                <div className="relative aspect-[16/9] w-full rounded-2xl bg-black overflow-hidden shadow-xl group">
                  {currentItemMediaItems.length === 0 ? (
                    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                      <ImageIcon className="h-12 w-12 text-slate-600 mb-2" />
                      <p className="text-sm font-bold text-slate-300">No {activeTab.toLowerCase()} uploaded for this event</p>
                    </div>
                  ) : activeMediaItem ? (
                    <>
                      {activeMediaItem.fileType === 'Video' ? (
                        <video
                          key={activeMediaItem._id}
                          src={getFullAssetUrl(activeMediaItem.fileUrl)}
                          controls
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <img
                          src={getFullAssetUrl(activeMediaItem.fileUrl)}
                          alt={selectedItem.title}
                          className="h-full w-full object-contain"
                        />
                      )}

                      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-xs font-extrabold text-white border border-white/10 shadow-lg">
                          {activeMediaIndex + 1} / {currentItemMediaItems.length}
                        </span>

                        <button
                          onClick={() => setShowFullModal(true)}
                          className="h-8 w-8 rounded-lg bg-black/60 backdrop-blur-md text-white hover:bg-black/80 flex items-center justify-center cursor-pointer border border-white/10"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                      </div>

                      {currentItemMediaItems.length > 1 && (
                        <button
                          onClick={handlePrevMedia}
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 dark:bg-black/60 text-slate-900 dark:text-white flex items-center justify-center shadow-xl cursor-pointer"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                      )}

                      {currentItemMediaItems.length > 1 && (
                        <button
                          onClick={handleNextMedia}
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 dark:bg-black/60 text-slate-900 dark:text-white flex items-center justify-center shadow-xl cursor-pointer"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                      )}
                    </>
                  ) : null}
                </div>

                {/* THUMBNAIL CAROUSEL */}
                {currentItemMediaItems.length > 0 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {currentItemMediaItems.map((item, idx) => {
                      const isActive = idx === activeMediaIndex;
                      const thumbUrl = getFullAssetUrl(item.fileUrl);

                      return (
                        <div
                          key={item._id || idx}
                          onClick={() => setActiveMediaIndex(idx)}
                          className={`relative h-16 w-24 rounded-xl bg-slate-955 overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${isActive
                              ? 'border-indigo-600 dark:border-indigo-400 scale-105 shadow-md ring-2 ring-indigo-500/30'
                              : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                        >
                          {item.fileType === 'Video' ? (
                            <div className="relative h-full w-full flex items-center justify-center">
                              <video src={thumbUrl} className="h-full w-full object-cover" muted />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Play className="h-5 w-5 text-white fill-current" />
                              </div>
                            </div>
                          ) : (
                            <img src={thumbUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 text-slate-400">
                Select an event from the list to view media.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {showFullModal && activeMediaItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-5xl w-full flex flex-col items-center justify-center">
            <button
              onClick={() => setShowFullModal(false)}
              className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>

            {activeMediaItem.fileType === 'Video' ? (
              <video
                src={getFullAssetUrl(activeMediaItem.fileUrl)}
                controls
                autoPlay
                className="max-h-[80vh] w-auto rounded-2xl"
              />
            ) : (
              <img
                src={getFullAssetUrl(activeMediaItem.fileUrl)}
                alt="Full View"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery;
