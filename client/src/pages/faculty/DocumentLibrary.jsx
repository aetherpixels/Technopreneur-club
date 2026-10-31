import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { getFullAssetUrl } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import {
  FileText,
  FileSpreadsheet,
  FileCheck,
  FileCode,
  Image as ImageIcon,
  Search,
  ChevronRight,
  Download,
  Plus,
  Calendar,
  Layers,
  X,
  Loader2,
  FolderDown,
  Trash2,
  Eye,
  ShieldCheck,
  Tag,
  Edit3
} from 'lucide-react';

const DOCUMENT_CATEGORIES = [
  { id: 'All', label: 'All Categories' },
  { id: 'PermissionLetter', label: 'Permission Letter' },
  { id: 'EventMeetingDoc', label: 'Event Meeting Document PDF' },
  { id: 'EventFinanceDoc', label: 'Event Finance Document PDF' },
  { id: 'AttendanceSheet', label: 'Attendance Sheet' },
  { id: 'Other', label: 'Other Documents' }
];

const DocumentLibrary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary Data States
  const [allEvents, setAllEvents] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Search States
  const [selectedEventId, setSelectedEventId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Document Lightbox Preview Modal
  const [previewDoc, setPreviewDoc] = useState(null);

  // Delete State
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Zip Download State
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const eventsRes = await axios.get('/api/events');
      const festRes = await axios.get('/api/festivals');
      const mediaRes = await axios.get('/api/media/all?fileType=Document');

      if (eventsRes.data.success) {
        setAllEvents(eventsRes.data.events || []);
      }

      if (festRes.data.success) {
        setFestivals(festRes.data.festivals || []);
      }

      if (mediaRes.data.success) {
        const mediaItems = mediaRes.data.media || [];
        const docItems = mediaItems.filter(
          (m) =>
            m.fileType === 'Document' ||
            (m.category !== 'GalleryPhoto' && m.category !== 'GalleryVideo')
        );
        setAllDocuments(docItems);
      }
    } catch (err) {
      console.error('Failed to load document library:', err);
      setError('Failed to load document library records.');
    } finally {
      setLoading(false);
    }
  };

  const unifiedItemsWithDocStats = useMemo(() => {
    // Single Events
    const singleItems = allEvents.filter((e) => !e.festival).map((evt) => {
      const eventDocs = allDocuments.filter((d) => d.event?._id === evt._id || d.event === evt._id);
      return {
        _id: evt._id,
        title: evt.title,
        subtitle: 'Single Event',
        date: evt.date,
        venue: evt.venue,
        banner: evt.poster,
        totalDocs: eventDocs.length,
        documents: eventDocs
      };
    });

    // Multi Events
    const multiItems = festivals.map((fest) => {
      const festDocs = allDocuments.filter((d) => d.festival?._id === fest._id || d.festival === fest._id);
      return {
        _id: fest._id,
        title: fest.name,
        subtitle: 'Multi Event',
        date: fest.startDate,
        venue: fest.venue,
        banner: fest.banner,
        totalDocs: festDocs.length,
        documents: festDocs
      };
    });

    return [...singleItems, ...multiItems];
  }, [allEvents, festivals, allDocuments]);

  // Filtered Items List for Left Column
  const filteredItemsList = useMemo(() => {
    let result = [...unifiedItemsWithDocStats];

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
  }, [unifiedItemsWithDocStats, searchQuery, sortBy]);

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
    return unifiedItemsWithDocStats.find((e) => e._id === selectedEventId) || filteredItemsList[0] || null;
  }, [selectedEventId, unifiedItemsWithDocStats, filteredItemsList]);

  // Active Documents for Selected Item (filtered by Category & Dept)
  const currentItemDocuments = useMemo(() => {
    if (!selectedItem) return [];
    let docs = selectedItem.documents || [];

    if (categoryFilter !== 'All') {
      if (categoryFilter === 'Other') {
        docs = docs.filter(
          (d) =>
            !['PermissionLetter', 'EventMeetingDoc', 'EventFinanceDoc', 'AttendanceSheet'].includes(d.category)
        );
      } else {
        docs = docs.filter((d) => d.category === categoryFilter);
      }
    }

    if (departmentFilter !== 'All') {
      docs = docs.filter((d) => {
        if (d.event && d.event.department === departmentFilter) return true;
        return false;
      });
    }

    return docs;
  }, [selectedItem, categoryFilter, departmentFilter]);

  // Bulk ZIP Download for Selected Item
  const handleBulkDownloadZip = async () => {
    if (!selectedItem || currentItemDocuments.length === 0) {
      return alert('No document files available to download.');
    }

    setIsZipping(true);
    setZipProgress(0);
    try {
      const zip = new JSZip();
      const sanitizedTitle = selectedItem.title.replace(/[^a-z0-9]/gi, '_');
      const folder = zip.folder(`${sanitizedTitle}_Documents`);

      for (let i = 0; i < currentItemDocuments.length; i++) {
        const item = currentItemDocuments[i];
        const fullUrl = getFullAssetUrl(item.fileUrl);

        try {
          const response = await fetch(fullUrl);
          const blob = await response.blob();
          const ext = item.fileUrl.split('.').pop() || 'pdf';
          const filename = `${item.category || 'Doc'}_${i + 1}.${ext}`;
          folder.file(filename, blob);
        } catch (fetchErr) {
          console.error(`Failed to download document ${i + 1}:`, fetchErr);
        }

        setZipProgress(Math.round(((i + 1) / currentItemDocuments.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = `${sanitizedTitle}_Official_Documents.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Zip creation error:', err);
      alert('Failed to generate Zip file for documents download.');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/media/${deletingDoc._id}`);
      if (res.data.success) {
        setAllDocuments((prev) => prev.filter((d) => d._id !== deletingDoc._id));
        setDeletingDoc(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const getFileIcon = (fileUrl) => {
    const ext = fileUrl.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return <FileText className="h-6 w-6 text-red-500" />;
    if (['doc', 'docx'].includes(ext)) return <FileText className="h-6 w-6 text-blue-500" />;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return <ImageIcon className="h-6 w-6 text-indigo-500" />;
    return <FileCode className="h-6 w-6 text-slate-500" />;
  };

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Dashboard</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span>Documents</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-blue-600 dark:text-blue-400 font-bold">Document Library</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2 font-heading">
            Event Document Library
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, preview, and download permission letters, meeting notes, finance PDFs, and attendance sheets.
          </p>
        </div>

        <button
          onClick={() =>
            navigate(selectedEventId ? `/faculty/upload?eventId=${selectedEventId}` : '/faculty/upload')
          }
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer hover:scale-105 shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Upload Event Documents</span>
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search document category, event title..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All">All Departments</option>
            <option value="CE">CE</option>
            <option value="IT">IT</option>
            <option value="CIVIL">CIVIL</option>
            <option value="MECH">MECH</option>
            <option value="EC">EC</option>
            <option value="EE">EE</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="newest">Sort by : Newest First</option>
            <option value="oldest">Sort by : Oldest First</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Loading Document Repository...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-sm text-red-600 font-medium">
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
                    className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-955/40 border-blue-500 dark:border-blue-400 shadow-md ring-1 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="h-16 w-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200/60">
                      <img src={posterUrl} alt={item.title} className="h-full w-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-blue-955 dark:text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                        {item.title}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                        <span>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                      </p>
                      <p className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                        {item.totalDocs} Official Documents
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT COLUMN: Selected Item Document Showcase */}
          <div className="lg:col-span-8 space-y-4">
            {selectedItem ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                      {selectedItem.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <FileCheck className="h-4 w-4 text-blue-500" />
                      {currentItemDocuments.length} Files
                    </span>

                    <button
                      onClick={handleBulkDownloadZip}
                      disabled={isZipping || currentItemDocuments.length === 0}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer shrink-0"
                    >
                      {isZipping ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Zipping ({zipProgress}%)</span>
                        </>
                      ) : (
                        <>
                          <FolderDown className="h-3.5 w-3.5" />
                          <span>Download All Zip</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {currentItemDocuments.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Documents Uploaded Yet</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Click "+ Upload Event Documents" above to upload official documents for this event.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentItemDocuments.map((doc) => {
                      const fullUrl = getFullAssetUrl(doc.fileUrl);
                      const filename = doc.fileUrl.split('/').pop();

                      return (
                        <div
                          key={doc._id}
                          className="flex flex-col justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 shrink-0">
                              {getFileIcon(doc.fileUrl)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-wider border border-blue-500/20">
                                {doc.category}
                              </span>

                              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 truncate" title={filename}>
                                {filename}
                              </h4>

                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Uploaded by {doc.uploader?.name || 'Faculty'} <span className="mx-1">•</span> {new Date(doc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs font-bold">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Preview</span>
                              </button>

                              <a
                                href={fullUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 text-slate-400">
                Select an event from the list to view document repository.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-955/30 border border-blue-200/70 dark:border-blue-900/50 text-blue-955 dark:text-blue-200">
        <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-slate-900 dark:text-white">Institutional Document Security Notice</h4>
          <p className="text-slate-600 dark:text-slate-300 mt-0.5">
            Document Repository access is strictly reserved for authorized Faculty and Administrator accounts.
          </p>
        </div>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex flex-col">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                {getFileIcon(previewDoc.fileUrl)}
                <div>
                  <h3 className="text-sm font-bold truncate max-w-md">{previewDoc.fileUrl.split('/').pop()}</h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="h-8 w-8 rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-auto p-4">
              {previewDoc.fileUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={getFullAssetUrl(previewDoc.fileUrl)}
                  className="w-full h-[65vh] border-0 rounded-2xl bg-white"
                  title="PDF Preview"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  <p>Preview not supported for this file type.</p>
                  <a
                    href={getFullAssetUrl(previewDoc.fileUrl)}
                    download
                    className="inline-flex items-center gap-1.5 px-4 py-2 mt-3 rounded-xl bg-blue-600 text-white font-bold"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download File to View</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {deletingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 text-center animate-fadeIn">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-650 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                Delete Document?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to permanently remove "{deletingDoc.fileUrl.split('/').pop()}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeletingDoc(null)}
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

export default DocumentLibrary;
