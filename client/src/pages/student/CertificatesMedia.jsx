import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Download, Image as ImageIcon, ExternalLink, ShieldCheck, Calendar, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const CertificatesMedia = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchCertificates = async () => {
    try {
      const certRes = await axios.get('/api/certificates');
      if (certRes.data.success) {
        setCertificates(certRes.data.certificates || []);
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const downloadCertificate = async (eId, title) => {
    try {
      const response = await axios.get(`/api/certificates/${eId}`, {
        responseType: 'blob'
      });
      
      const fileBlob = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(fileBlob);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Certificate_${title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to download certificate. Please contact event organizer.' });
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
            My Certificates & Media Hub
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View and download your official, verified participation certificates and explore event photo galleries.
          </p>
        </div>

        {/* Link to View Media Gallery */}
        <Link
          to="/media"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 shrink-0"
        >
          <ImageIcon className="h-4 w-4" />
          <span>Explore Event Media Gallery</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {alert.message && (
        <div className={`rounded-2xl p-4 text-xs font-bold border ${
          alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {alert.message}
        </div>
      )}

      {/* Main Certificates Showcase Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
            <Award className="h-5 w-5 text-amber-500" />
            <span>Earned Certificates ({certificates.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs font-bold text-slate-400">Loading your verified certificates...</div>
        ) : certificates.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Certificates Earned Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Participate in registered campus events! Once the faculty organizer marks your attendance as "Present", your certificate will be generated here automatically.
            </p>
            <div className="pt-2">
              <Link
                to="/student/upcoming"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
              >
                Browse Upcoming Events
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 text-[10px] font-extrabold uppercase border border-blue-500/20">
                      <ShieldCheck className="h-3 w-3" />
                      ID: {cert.certificateId}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white line-clamp-2">
                    {cert.event?.title || 'Event Certificate'}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official Certificate of Participation awarded for attending the activity.
                  </p>
                </div>

                <button
                  onClick={() => downloadCertificate(cert.event?._id, cert.event?.title || 'Event')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF Certificate</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Notice Banner */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Info className="h-5 w-5" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-slate-900 dark:text-white">Media Viewing & Download Access</h4>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Event media photos and videos are managed and published exclusively by Faculty organizers. Students have 1-click bulk ZIP download access in the Media Gallery.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificatesMedia;
