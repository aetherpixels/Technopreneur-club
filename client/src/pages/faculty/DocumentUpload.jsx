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
  FileText,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  Tag,
  CalendarDays,
  Layers,
  Sparkles,
  Edit3,
  Mail,
  Folder,
  FileCheck
} from 'lucide-react';

const DOCUMENT_CATEGORIES = [
  { id: 'PermissionLetter', label: 'Permission Letter', icon: Mail },
  { id: 'EventMeetingDoc', label: 'Event Meeting Document PDF', icon: FileText },
  { id: 'EventFinanceDoc', label: 'Event Finance Document PDF', icon: FileSpreadsheet },
  { id: 'AttendanceSheet', label: 'Attendance Sheet', icon: FileCheck },
  { id: 'Other', label: 'Other (Custom Category)', icon: Folder }
];

const DocumentUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fileInputRef = useRef(null);

  // Data states
  const [allEvents, setAllEvents] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('PermissionLetter');
  const [customCategory, setCustomCategory] = useState('');
  const [existingDocs, setExistingDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Staged files for upload
  const [stagedFiles, setStagedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState({ type: '', text: '' });

  // Delete modal state
  const [docToDelete, setDocToDelete] = useState(null);
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
        ...evList.filter(e => !e.festival).map(e => ({ _id: e._id, name: e.title, type: 'Standalone', date: e.date, venue: e.venue, poster: e.poster })),
        ...festList.map(f => ({ _id: f._id, name: f.name, type: 'Festival', date: f.startDate, venue: f.venue, poster: f.banner }))
      ];

      if (combined.length > 0) {
        const paramEventId = searchParams.get('eventId');
        const match = combined.find(c => c._id === paramEventId);
        setSelectedTargetId(match ? match._id : combined[0]._id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch events and festivals data.');
    } finally {
      setLoading(false);
    }
  };

  const targets = useMemo(() => {
    return [
      ...allEvents.filter(e => !e.festival).map(e => ({
        _id: e._id,
        name: e.title,
        type: 'Standalone',
        displayLabel: `[Single Event] ${e.title}`,
        date: e.date,
        venue: e.venue,
        poster: e.poster
      })),
      ...festivals.map(f => ({
        _id: f._id,
        name: f.name,
        type: 'Festival',
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
    setExistingDocs([]);
    try {
      const url = selectedTarget.type === 'Standalone'
        ? `/api/media/event/${selectedTargetId}`
        : `/api/media/festival/${selectedTargetId}`;
      const res = await axios.get(url);
      if (res.data.success) {
        const docs = (res.data.media || []).filter(
          (m) =>
            m.fileType === 'Document' ||
            (m.category !== 'GalleryPhoto' && m.category !== 'GalleryVideo')
        );
        setExistingDocs(docs);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  useEffect(() => {
    fetchMediaContent();
  }, [selectedTargetId, selectedTarget]);

  // Resolve final Category string
  const effectiveCategory = useMemo(() => {
    if (selectedCategory === 'Other') {
      return customCategory.trim() || 'Other Document';
    }
    return selectedCategory;
  }, [selectedCategory, customCategory]);

  // Handle Drag & Drop / File Select
  const handleFileSelect = (files) => {
    setUploadFeedback({ type: '', text: '' });
    if (!files || files.length === 0) return;

    if (selectedCategory === 'Other' && !customCategory.trim()) {
      return setUploadFeedback({
        type: 'error',
        text: 'Please type a custom document category name first.'
      });
    }

    const newStaged = Array.from(files).map((file) => {
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        category: effectiveCategory,
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
      return setUploadFeedback({ type: 'error', text: 'Please drag & drop or select documents to upload.' });
    }

    setUploading(true);
    setUploadFeedback({ type: '', text: '' });

    const formData = new FormData();
    if (selectedTarget.type === 'Standalone') {
      formData.append('eventId', selectedTargetId);
    } else {
      formData.append('festivalId', selectedTargetId);
    }

    stagedFiles.forEach((item) => {
      formData.append('files', item.file);
      formData.append('category', item.category || effectiveCategory);
    });

    try {
      const res = await axios.post('/api/media/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setUploadFeedback({
          type: 'success',
          text: `Successfully uploaded ${stagedFiles.length} official document(s)!`
        });
        setStagedFiles([]);
        fetchMediaContent();
      }
    } catch (err) {
      console.error('Batch upload error:', err);
      setUploadFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to upload documents. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  // Delete Media Item from Server
  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    setDeleting(true);

    try {
      const res = await axios.delete(`/api/media/${docToDelete._id}`);
      if (res.data.success) {
        setExistingDocs((prev) => prev.filter((m) => m._id !== docToDelete._id));
        setDocToDelete(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document item');
    } finally {
      setDeleting(false);
    }
  };

  const totalFileCount = stagedFiles.length + existingDocs.length;

  const getFileIcon = (fileUrl) => {
    const ext = fileUrl.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return <FileText className="h-5 w-5 text-red-500" />;
    if (['doc', 'docx'].includes(ext)) return <FileText className="h-5 w-5 text-blue-500" />;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    return <FileCode className="h-5 w-5 text-slate-500" />;
  };

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Dashboard</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span>Events</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-blue-600 dark:text-blue-400 font-bold">Document Upload</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2 font-heading">
            Upload Official Event Documents
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Archive permission letters, meeting PDFs, event finance documents, attendance sheets, and custom reports.
          </p>
        </div>

        <button
          onClick={() => navigate('/faculty/documents')}
          className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 px-4 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Document Library</span>
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
              className="w-full md:w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 cursor-pointer"
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

      {/* Simplified Category Selector (without emojis, with clean Lucide icons) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-heading">
          <Tag className="h-3.5 w-3.5 text-blue-500" />
          <span>Select Document Category for Upload:</span>
        </label>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {DOCUMENT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const IconComp = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-102'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <IconComp className="h-4 w-4 shrink-0" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {selectedCategory === 'Other' && (
          <div className="pt-2 animate-fadeIn">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
              <Edit3 className="h-3.5 w-3.5" />
              <span>Type Custom Document Category Name:</span>
            </label>
            <input
              type="text"
              required
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g. Sponsorship Agreement / Guest Brief / Technical Guidelines..."
              className="w-full max-w-md rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>
        )}
      </div>

      {/* Drag & Drop Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl transition-all text-center min-h-[260px] ${
              isDragOver
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 scale-[1.01]'
                : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50/40'
            }`}
          >
            <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg mb-4 shadow-blue-500/30">
              <UploadCloud className="h-8 w-8" />
            </div>

            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Drag & Drop PDF or Excel sheets here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer bg-transparent"
              >
                browse local storage
              </button>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports: PDF, DOCX, XLSX, CSV, PPTX up to 10MB per document.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        </div>

        {/* Upload staged summary */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                Upload Queue
              </span>
              <span className="text-[10px] font-extrabold text-blue-600 px-2 py-0.5 bg-blue-50 dark:bg-blue-950 rounded-full">
                {stagedFiles.length} staged
              </span>
            </div>

            {stagedFiles.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Staged queue is currently empty. Drag items to begin.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                {stagedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getFileIcon(file.name)}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {file.size} • <span className="font-semibold text-blue-500">{file.category}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStagedFile(file.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {uploadFeedback.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  uploadFeedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                }`}
              >
                {uploadFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                )}
                <span>{uploadFeedback.text}</span>
              </div>
            )}

            <button
              onClick={handleUploadAll}
              disabled={uploading || stagedFiles.length === 0}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-850 disabled:text-slate-400 text-xs font-bold text-white shadow-lg shadow-blue-500/15 disabled:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Uploading files...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4.5 w-4.5" />
                  <span>Start Batch Upload</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Existing official documents list */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              Archived Event Documents ({existingDocs.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Documents currently archived under this selection.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading archived documents...</div>
        ) : existingDocs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl">
            No official documents uploaded under this event / festival target.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {existingDocs.map((doc) => (
              <div
                key={doc._id}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                    {getFileIcon(doc.fileUrl)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                      {doc.originalName || 'Document file'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                      {doc.category || 'General'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={getFullAssetUrl(doc.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-xs font-bold text-blue-600 hover:underline"
                  >
                    View
                  </a>
                  <button
                    onClick={() => setDocToDelete(doc)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 text-center animate-fadeIn">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                Delete Archived Document?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to permanently delete "{docToDelete.originalName}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDocToDelete(null)}
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

export default DocumentUpload;
