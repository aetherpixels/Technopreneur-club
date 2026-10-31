import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { getFullAssetUrl } from '../../config/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UploadCloud,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  Play,
  Layers,
  CalendarDays,
  Sparkles
} from 'lucide-react';

const ManageMedia = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fileInputRef = useRef(null);

  // Data states
  const [allEvents, setAllEvents] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [existingMedia, setExistingMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Staged files for upload
  const [stagedFiles, setStagedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState({ type: '', text: '' });

  // Delete modal state
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const eventsRes = await axios.get('/api/events');
      const festRes = await axios.get('/api/festivals');

      let evList = [];
      let festList = [];

      if (eventsRes.data.success) {
        evList = eventsRes.data.events || [];
        setAllEvents(evList);
      }
      if (festRes.data.success) {
        festList = festRes.data.festivals || [];
        setFestivals(festList);
      }

      // Combine targets
      const combined = [
        ...evList.filter(e => !e.festival).map(e => ({ _id: e._id, name: e.title, type: 'Single', date: e.date, venue: e.venue, poster: e.poster })),
        ...festList.map(f => ({ _id: f._id, name: f.name, type: 'Multiple', date: f.startDate, venue: f.venue, poster: f.banner }))
      ];

      if (combined.length > 0) {
        const paramEventId = searchParams.get('eventId');
        const match = combined.find(c => c._id === paramEventId);
        setSelectedTargetId(match ? match._id : combined[0]._id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch event data.');
    } finally {
      setLoading(false);
    }
  };

  const targets = useMemo(() => {
    return [
      ...allEvents.filter(e => !e.festival).map(e => ({
        _id: e._id,
        name: e.title,
        type: 'Single',
        displayLabel: `[Single Event] ${e.title}`,
        date: e.date,
        venue: e.venue,
        poster: e.poster
      })),
      ...festivals.map(f => ({
        _id: f._id,
        name: f.name,
        type: 'Multiple',
        displayLabel: `[Multi Event] ${f.name}`,
        date: f.startDate,
        venue: f.venue,
        poster: f.banner
      }))
    ];
  }, [allEvents, festivals]);

  const selectedTarget = useMemo(() => {
    return targets.find(t => t._id === selectedTargetId) || null;
  }, [targets, selectedTargetId]);

  const fetchMediaContent = async () => {
    if (!selectedTargetId || !selectedTarget) return;
    setExistingMedia([]);
    try {
      const url = selectedTarget.type === 'Single'
        ? `/api/media/event/${selectedTargetId}?fileType=Image,Video`
        : `/api/media/festival/${selectedTargetId}?fileType=Image,Video`;
      const res = await axios.get(url);
      if (res.data.success) {
        setExistingMedia(res.data.media || []);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    }
  };

  useEffect(() => {
    fetchMediaContent();
  }, [selectedTargetId, selectedTarget]);

  // Handle Drag & Drop / File Select
  const handleFileSelect = (files) => {
    setUploadFeedback({ type: '', text: '' });
    if (!files || files.length === 0) return;

    const newStaged = Array.from(files).map((file) => {
      const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mov');
      const isImage = file.type.startsWith('image/') || file.name.endsWith('.jpg') || file.name.endsWith('.png');

      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: isVideo ? 'Video' : isImage ? 'Image' : 'Document',
        staged: true
      };
    });

    setStagedFiles((prev) => [...prev, ...newStaged]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeStagedFile = (id) => {
    setStagedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  // Upload All Staged Files
  const handleUploadAll = async () => {
    if (!selectedTargetId || !selectedTarget) {
      return setUploadFeedback({ type: 'error', text: 'Please select a target event before uploading.' });
    }
    if (stagedFiles.length === 0) {
      return setUploadFeedback({ type: 'error', text: 'Please stage files before uploading.' });
    }

    setUploading(true);
    setUploadFeedback({ type: '', text: '' });

    const formData = new FormData();
    if (selectedTarget.type === 'Single') {
      formData.append('eventId', selectedTargetId);
    } else {
      formData.append('festivalId', selectedTargetId);
    }

    stagedFiles.forEach((item) => {
      formData.append('files', item.file);
      // Determine category (defaulting to GalleryPhoto or GalleryVideo)
      const category = item.type === 'Video' ? 'GalleryVideo' : 'GalleryPhoto';
      formData.append('category', category);
    });

    try {
      const res = await axios.post('/api/media/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setUploadFeedback({
          type: 'success',
          text: `Successfully uploaded ${stagedFiles.length} media item(s)!`
        });
        setStagedFiles([]);
        fetchMediaContent();
      }
    } catch (err) {
      console.error('Batch upload error:', err);
      setUploadFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to upload media. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  // Delete Media Item from Server
  const handleDeleteConfirm = async () => {
    if (!mediaToDelete) return;
    setDeleting(true);

    try {
      const res = await axios.delete(`/api/media/${mediaToDelete._id}`);
      if (res.data.success) {
        setExistingMedia((prev) => prev.filter((m) => m._id !== mediaToDelete._id));
        setMediaToDelete(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete media item');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2 font-heading">
            Manage Event Media Gallery
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload photos, videos and highlights for public showcase.
          </p>
        </div>

        <button
          onClick={() => navigate('/faculty/manage-events')}
          className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 px-4 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Manage Events</span>
        </button>
      </div>

      {/* Scope Selector Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {selectedTarget ? (
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="h-16 w-24 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                <img
                  src={selectedTarget.poster ? getFullAssetUrl(selectedTarget.poster) : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}
                  alt={selectedTarget.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedTarget.type === 'Festival' ? 'text-purple-500' : 'text-blue-500'}`}>
                  {selectedTarget.type === 'Festival' ? 'Multi Event' : 'Single Event'}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{selectedTarget.name}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {selectedTarget.date ? new Date(selectedTarget.date).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {selectedTarget.venue || 'Campus Venue'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-2">
              No target events found
            </div>
          )}

          {/* Unified Dropdown Selector */}
          <div className="w-full md:w-auto shrink-0">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Select Target Event:
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full md:w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-955 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              {targets.map((tgt) => (
                <option key={tgt._id} value={tgt._id}>
                  {tgt.displayLabel}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Upload Section: Drag & Drop Zone + Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl transition-all text-center min-h-[260px] ${isDragOver
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[1.01]'
                : 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-indigo-50/40'
              }`}
          >
            <div className="h-16 w-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg mb-4 shadow-indigo-500/30">
              <UploadCloud className="h-8 w-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">Drag & Drop files here</h3>
            <p className="text-xs text-slate-400 my-1">or</p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/jpg,video/mp4,video/mov"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-105"
            >
              Browse Files
            </button>

            <p className="text-[11px] font-semibold text-slate-400 mt-4">
              Supports: JPG, PNG, MP4, MOV <span className="mx-1">•</span> Max file size: 100MB per file
            </p>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
            Upload Guidelines
          </h3>

          <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>You can upload multiple photos and videos at once.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>Image formats: JPG, PNG, JPEG</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>Video formats: MP4, MOV</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>Maximum file size: 100MB per file</span>
            </li>
          </ul>
        </div>
      </div>

      {uploadFeedback.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${uploadFeedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
            }`}
        >
          {uploadFeedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          )}
          <span>{uploadFeedback.text}</span>
        </div>
      )}

      {stagedFiles.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-heading">
              Staged Media Queue ({stagedFiles.length})
            </span>
            <button
              onClick={handleUploadAll}
              disabled={uploading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading Queue...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Queue</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {stagedFiles.map((item) => (
              <div
                key={item.id}
                className="relative rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-video group"
              >
                {item.type === 'Video' ? (
                  <div className="h-full w-full flex items-center justify-center bg-slate-900 text-indigo-400">
                    <Play className="h-8 w-8" />
                  </div>
                ) : (
                  <img
                    src={URL.createObjectURL(item.file)}
                    alt="staged file"
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                  <p className="text-[10px] font-bold text-white truncate w-full mb-1">{item.name}</p>
                  <button
                    onClick={() => removeStagedFile(item.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-650 hover:bg-red-700 text-white shadow"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing uploaded media grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
          Existing Media Gallery ({existingMedia.length})
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading media library...</div>
        ) : existingMedia.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl">
            No media uploads found under this event target.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {existingMedia.map((media) => (
              <div
                key={media._id}
                className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-square group"
              >
                {media.fileType === 'Video' ? (
                  <video
                    src={getFullAssetUrl(media.fileUrl)}
                    className="h-full w-full object-cover opacity-80"
                    muted
                  />
                ) : (
                  <img
                    src={getFullAssetUrl(media.fileUrl)}
                    alt="Gallery item"
                    className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                )}

                {media.fileType === 'Video' && (
                  <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
                    <Play className="h-10 w-10 p-2.5 rounded-full bg-slate-900/60 backdrop-blur-md" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-[10px] font-bold text-white truncate">{media.originalName || 'Media File'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <a
                      href={getFullAssetUrl(media.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-extrabold text-indigo-400 hover:underline"
                    >
                      View Full
                    </a>
                    <button
                      onClick={() => setMediaToDelete(media)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {mediaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 text-center animate-fadeIn">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                Delete Media Item?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to permanently remove "{mediaToDelete.originalName || 'this file'}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setMediaToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-md cursor-pointer flex items-center gap-1"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMedia;
