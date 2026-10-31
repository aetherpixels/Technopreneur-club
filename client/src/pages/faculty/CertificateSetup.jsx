import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Upload,
  ArrowLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash,
  Tag,
  FileCheck,
  X
} from 'lucide-react';
import { getFullAssetUrl } from '../../config/api';

const PLACEHOLDER_GROUPS = [
  {
    category: 'Event Information',
    items: [
      { tag: '{{Event Name}}', label: 'Event Name' },
      { tag: '{{Event Type}}', label: 'Event Type' },
      { tag: '{{Description}}', label: 'Description' },
      { tag: '{{Venue}}', label: 'Venue' },
      { tag: '{{Event Date}}', label: 'Date' },
      { tag: '{{Time}}', label: 'Time' },
      { tag: '{{Organized By}}', label: 'Organized By' },
      { tag: '{{Department}}', label: 'Department' },
      { tag: '{{Academic Year}}', label: 'Academic Year' },
      { tag: '{{Organizer}}', label: 'Organizer' },
      { tag: '{{Faculty Name}}', label: 'Faculty Name' },
      { tag: '{{Registration Type}}', label: 'Registration Type' },
      { tag: '{{Event Duration}}', label: 'Event Duration' },
      { tag: '{{Event Category}}', label: 'Event Category' }
    ]
  },
  {
    category: 'Student Information',
    items: [
      { tag: '{{Student Name}}', label: 'Student Name' },
      { tag: '{{Enrollment Number}}', label: 'Enrollment Number' },
      { tag: '{{Student Department}}', label: 'Student Department' },
      { tag: '{{Semester}}', label: 'Semester' },
      { tag: '{{Email}}', label: 'Email' }
    ]
  },
  {
    category: 'Registration Information',
    items: [
      { tag: '{{Registration Date}}', label: 'Registration Date' },
      { tag: '{{Registration ID}}', label: 'Registration ID' }
    ]
  },
  {
    category: 'Certificate Information',
    items: [
      { tag: '{{Issue Date}}', label: 'Certificate Issue Date' },
      { tag: '{{Certificate ID}}', label: 'Certificate Number' }
    ]
  }
];

const CertificateSetup = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Wizard Steps: 1 = Details, 2 = Logos, 3 = Signatories, 4 = Layout Preview
  const [step, setStep] = useState(1);

  // Core Staged States
  const [title, setTitle] = useState('Certificate of Participation');
  const [description, setDescription] = useState(
    '(Enrollment Number: {{Enrollment Number}}) has successfully participated in the {{Event Type}} event "{{Event Name}}" organized at {{Venue}} during the academic year {{Academic Year}}.'
  );
  const [issueDate, setIssueDate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventName, setEventName] = useState('');

  // Logos List (mixture of raw file objects and existing URL strings)
  const [logos, setLogos] = useState([]);

  // Signatories List
  // { name: '', designation: '', signatureFile: null, signatureUrl: '', tempPreviewUrl: '' }
  const [signatories, setSignatories] = useState([
    { name: '', designation: '', signatureFile: null, signatureUrl: '', tempPreviewUrl: '' }
  ]);

  // UI Utilities
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');
  const descRef = useRef(null);

  useEffect(() => {
    fetchExistingConfig();
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [eventId]);

  const fetchExistingConfig = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Event date to initialize issue date fallback
      const eventRes = await axios.get(`/api/events/${eventId}`);
      if (eventRes.data.success) {
        const ev = eventRes.data.event;
        setEventName(ev.title);
        setEventDate(ev.date);

        const defaultDate = ev.date ? new Date(ev.date).toISOString().split('T')[0] : '';
        setIssueDate(defaultDate);
      }

      // 2. Fetch existing config if any
      const configRes = await axios.get(`/api/certificates/config/${eventId}`);
      if (configRes.data.success && configRes.data.configExists) {
        const cfg = configRes.data.config;
        setTitle(cfg.title || 'Certificate of Participation');
        setDescription(cfg.description || '');
        if (cfg.issueDate) {
          setIssueDate(new Date(cfg.issueDate).toISOString().split('T')[0]);
        }

        // Map logos
        if (cfg.logos && cfg.logos.length > 0) {
          setLogos(cfg.logos.map(url => ({ isExisting: true, url, preview: getFullAssetUrl(url) })));
        }

        // Map signatories
        if (cfg.signatories && cfg.signatories.length > 0) {
          setSignatories(cfg.signatories.map(s => ({
            name: s.name,
            designation: s.designation,
            signatureFile: null,
            signatureUrl: s.signatureUrl,
            tempPreviewUrl: s.signatureUrl ? getFullAssetUrl(s.signatureUrl) : ''
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching event config:', err);
      setError('Failed to fetch certificate configuration data.');
    } finally {
      setLoading(false);
    }
  };

  // Staging new logos
  const handleLogoUpload = (e) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      const newStaged = filesArr.map(file => ({
        isExisting: false,
        file,
        preview: URL.createObjectURL(file)
      }));
      setLogos([...logos, ...newStaged]);
    }
  };

  const removeLogo = (idx) => {
    const target = logos[idx];
    if (!target.isExisting) {
      URL.revokeObjectURL(target.preview);
    }
    setLogos(logos.filter((_, i) => i !== idx));
  };

  // Signatories handlers
  const addSignatory = () => {
    setSignatories([
      ...signatories,
      { name: '', designation: '', signatureFile: null, signatureUrl: '', tempPreviewUrl: '' }
    ]);
  };

  const removeSignatory = (idx) => {
    const target = signatories[idx];
    if (target.tempPreviewUrl && !target.signatureUrl) {
      URL.revokeObjectURL(target.tempPreviewUrl);
    }
    setSignatories(signatories.filter((_, i) => i !== idx));
  };

  const updateSignatory = (idx, fields) => {
    const updated = [...signatories];
    updated[idx] = { ...updated[idx], ...fields };
    setSignatories(updated);
  };

  const handleSignatureUpload = (idx, file) => {
    if (file) {
      const preview = URL.createObjectURL(file);
      updateSignatory(idx, {
        signatureFile: file,
        signatureUrl: '', // Reset existing path
        tempPreviewUrl: preview
      });
    }
  };

  // Insert placeholder tags into textarea cursor position
  const insertPlaceholder = (tag) => {
    const textarea = descRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + tag + after;
      setDescription(newText);

      // Reset cursor focus
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + tag.length;
      }, 50);
    } else {
      setDescription(prev => prev + ' ' + tag);
    }
  };

  // Helper to package wizard state into FormData for server
  const buildFormData = () => {
    const fd = new FormData();
    fd.append('eventId', eventId);
    fd.append('title', title);
    fd.append('description', description);
    fd.append('issueDate', issueDate);

    // Filter existing logos and append as JSON
    const existingLogoUrls = logos.filter(l => l.isExisting).map(l => l.url);
    fd.append('existingLogos', JSON.stringify(existingLogoUrls));

    // Append newly uploaded logo files
    logos.filter(l => !l.isExisting).forEach(l => {
      fd.append('logos', l.file);
    });

    // Package signatories array (omitting files, referencing url placeholders)
    const sigList = signatories.map(s => ({
      name: s.name,
      designation: s.designation,
      signatureUrl: s.signatureUrl
    }));
    fd.append('signatories', JSON.stringify(sigList));

    // Append signature files in matching sequence
    signatories.forEach(s => {
      if (s.signatureFile) {
        fd.append('signatures', s.signatureFile);
      }
    });

    return fd;
  };

  // Dynamic preview PDF generator
  const loadCertificatePreview = async () => {
    setError('');
    // Basic validation
    if (!title.trim() || !description.trim()) {
      return setError('Please enter a certificate title and content description.');
    }
    const emptySigs = signatories.some(s => !s.name.trim());
    if (emptySigs) {
      return setError('Please fill in the name for all signatories.');
    }
    const missingSigs = signatories.some(s => !s.signatureUrl && !s.signatureFile);
    if (missingSigs) {
      return setError('Please upload a signature image file for each signatory.');
    }

    setSaving(true);
    try {
      const fd = buildFormData();
      const res = await axios.post('/api/certificates/preview', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }

      const fileBlob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(fileBlob);
      setPreviewBlobUrl(blobUrl);
      setStep(4);
    } catch (err) {
      console.error('Error generating preview:', err);
      let errorMsg = 'Failed to generate template layout preview.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errorMsg = json.message;
        } catch (e) {}
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Submit and lock configuration
  const handleSaveConfig = async () => {
    setError('');
    setSaving(true);
    try {
      const fd = buildFormData();
      const res = await axios.post('/api/certificates/config', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        // Unlock and navigate to Attendance marking!
        navigate(`/faculty/attendance/${eventId}`);
      }
    } catch (err) {
      console.error('Failed to save config:', err);
      setError(err.response?.data?.message || 'Failed to register certificate configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col py-36 items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-600">Verifying event status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Header Banner */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
        <button
          onClick={() => navigate('/faculty/manage-events')}
          className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-heading">
            Automated Certificate Configuration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure logos, text, and signatures for: <strong className="text-slate-850 dark:text-slate-200">{eventName}</strong>
          </p>
        </div>
      </div>

      {/* Progress Wizard Indicator */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-around gap-4 text-xs font-bold text-slate-400">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : ''}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>1</span>
            <span>Content details</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200 hidden sm:block"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : ''}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-blue-600 text-white' : step > 2 ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>2</span>
            <span>Institutions logos</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200 hidden sm:block"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : ''}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-blue-600 text-white' : step > 3 ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>3</span>
            <span>Faculty signatories</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200 hidden sm:block"></div>
          <div className={`flex items-center gap-2 ${step >= 4 ? 'text-blue-600' : ''}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>4</span>
            <span>Confirm preview</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-650 flex items-center gap-2.5">
          <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: CONTENT DETAILS */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 animate-fadeIn">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Certificate Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Certificate of Appreciation / Excellence"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Certificate Content Description <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Click tags below to insert placeholders</span>
            </div>

            {/* Interactive placeholder dropdown */}
            <div className="flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Tag className="h-4 w-4 text-slate-400" />
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    insertPlaceholder(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="flex-1 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>-- Select a placeholder to insert --</option>
                {PLACEHOLDER_GROUPS.map((group) => (
                  <optgroup key={group.category} label={group.category}>
                    {group.items.map((item) => (
                      <option key={item.tag} value={item.tag}>
                        {item.label} ({item.tag})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <textarea
              ref={descRef}
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write the paragraph of the certificate here using the tags above..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold leading-relaxed text-slate-850 dark:text-slate-200 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Certificate Issue Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Defaults to the scheduled event completion date.</p>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer"
            >
              <span>Next Step: Logos</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ORGANIZATIONAL LOGOS */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">Upload Institution & Event Logos</h3>
            <p className="text-xs text-slate-400 mt-0.5">Upload college, university, department, or sponsor logos. The system will auto-align them and convert white backgrounds to transparent.</p>
          </div>

          {/* Drag & drop upload box */}
          <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl p-8 text-center flex flex-col items-center justify-center hover:bg-slate-50/80 cursor-pointer min-h-[180px]">
            <Upload className="h-10 w-10 text-slate-400 mb-3" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag logo images here or browse local folders</span>
            <span className="text-[10px] text-slate-400 mt-1">Supports JPG, PNG, JPEG formats up to 5MB</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleLogoUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Staged Logos grid */}
          {logos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {logos.map((logo, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-2xl border border-slate-250 dark:border-slate-850 p-2 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center aspect-square"
                >
                  <img src={logo.preview} alt="Logo" className="max-h-20 max-w-full object-contain" />
                  <button
                    onClick={() => removeLogo(idx)}
                    className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md hover:scale-105 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer"
            >
              <span>Next Step: Signatories</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SIGNATORIES */}
      {step === 3 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">Faculty & Administration Signatories</h3>
            <p className="text-xs text-slate-400 mt-0.5">Define one or multiple signatories (HOD, Coordinator, Principal). Upload signature images, and our smart processor will remove paper background.</p>
          </div>

          <div className="space-y-4">
            {signatories.map((sig, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-4 relative group/sig"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500">Signatory #{idx + 1}</h4>
                  {signatories.length > 1 && (
                    <button
                      onClick={() => removeSignatory(idx)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                      title="Remove Signatory"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name and Designation */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                        Signatory Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sig.name}
                        onChange={(e) => updateSignatory(idx, { name: e.target.value })}
                        placeholder="e.g. Dr. Rajesh Sharma"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">
                        Designation / Role
                      </label>
                      <input
                        type="text"
                        value={sig.designation}
                        onChange={(e) => updateSignatory(idx, { designation: e.target.value })}
                        placeholder="e.g. Head of CE Department"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Signature File Uploader */}
                  <div className="flex flex-col justify-center border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5 text-center">
                      Upload Signature Image <span className="text-red-500">*</span>
                    </label>

                    {sig.tempPreviewUrl ? (
                      <div className="relative group/img flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <img src={sig.tempPreviewUrl} alt="Signature Preview" className="h-16 object-contain" />
                        <button
                          type="button"
                          onClick={() => updateSignatory(idx, { signatureFile: null, signatureUrl: '', tempPreviewUrl: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-sm hover:scale-105 transition-all opacity-0 group-hover/img:opacity-100 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer min-h-[90px]">
                        <Upload className="h-5 w-5 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-650">Select Signature Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSignatureUpload(idx, e.target.files?.[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={addSignatory}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-500 text-blue-600 text-xs font-bold cursor-pointer hover:bg-blue-50/30 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Another Signatory</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={loadCertificatePreview}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Assets...</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Generate Preview layout</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: LIVE PREVIEW & CONFIRM */}
      {step === 4 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">Automated Template Preview</h3>
            <p className="text-xs text-slate-400 mt-0.5">Please review the dynamically compiled certificate template below. If the formatting, logo spacing, and signatures look correct, click Confirm to save config and unlock Attendance.</p>
          </div>

          {/* Iframe for PDF preview */}
          {previewBlobUrl ? (
            <div className="border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden bg-slate-950 aspect-[1.414/1] w-full">
              <iframe src={previewBlobUrl} className="w-full h-full border-0" title="Certificate PDF Mockup Preview" />
            </div>
          ) : (
            <div className="p-16 border border-dashed rounded-2xl text-center text-slate-400">
              Generating template preview...
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              Edit Setup
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Configuration...</span>
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  <span>Confirm & Unlock Attendance</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateSetup;
