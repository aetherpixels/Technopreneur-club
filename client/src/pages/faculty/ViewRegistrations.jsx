import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Download, ArrowLeft, Users, DownloadCloud, Eye, X, FileText } from 'lucide-react';
import { getFullAssetUrl } from '../../config/api';

const ViewRegistrations = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [preparingExcel, setPreparingExcel] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchEventData = async () => {
    try {
      const eventRes = await axios.get(`/api/events/${eventId}`);
      const regsRes = await axios.get(`/api/registrations/event/${eventId}`);
      
      if (eventRes.data.success && regsRes.data.success) {
        setEvent(eventRes.data.event);
        setRegistrations(regsRes.data.registrations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const handleExport = async (format) => {
    try {
      setPreparingExcel(true);
      const response = await axios.get(`/api/registrations/event/${eventId}/export?format=${format}`, {
        responseType: 'blob'
      });
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${event?.title || 'Event'}_Registrations.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      alert('Unable to download registrations. Please try again.');
    } finally {
      setPreparingExcel(false);
    }
  };

  const filteredRegistrations = registrations.filter(r => 
    r.student?.name.toLowerCase().includes(search.toLowerCase()) || 
    r.student?.enrollmentNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/faculty/manage-events')}
            className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">View Registrations</h1>
            <p className="text-sm text-slate-500">Event: <strong className="text-slate-800 font-semibold">{event?.title}</strong></p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('excel')}
            disabled={preparingExcel}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow transition-all ${
              preparingExcel ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {preparingExcel ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Preparing Excel...</span>
              </>
            ) : (
              <>
                <DownloadCloud className="h-4 w-4" />
                <span>Download Responses</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <div className="relative flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute inset-y-0 left-0 pl-3 h-10 w-8 text-slate-400" />
              <input
                type="text"
                placeholder="Search student by name or enrollment number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:bg-white focus:outline-none max-w-md"
              />
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Users className="h-4 w-4" />
              <span>{filteredRegistrations.length} Registrations</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Enrollment Number</th>
                <th className="px-6 py-4 whitespace-nowrap">Student Name</th>
                <th className="px-6 py-4 whitespace-nowrap">Department</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Attendance</th>
                {event?.customQuestions?.map(q => (
                  <th key={q._id} className="px-6 py-4 whitespace-nowrap" title={q.questionText}>
                    {q.questionText.length > 25 ? q.questionText.substring(0, 25) + '...' : q.questionText}
                  </th>
                ))}
                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">No matching student registrations found.</td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">{reg.student?.enrollmentNumber || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{reg.student?.name || 'N/A'}</div>
                      <div className="text-xs text-slate-400">{reg.student?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap">{reg.student?.department || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        reg.status === 'Registered' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        reg.attendanceStatus === 'Present' ? 'bg-emerald-50 text-emerald-700' : 
                        reg.attendanceStatus === 'Absent' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {reg.attendanceStatus}
                      </span>
                    </td>
                    
                    {event?.customQuestions?.map(q => {
                      const response = reg.customResponses?.find(r => 
                        (r.questionId && r.questionId.toString() === q._id.toString()) || 
                        r.questionText === q.questionText
                      );
                      let content = <span className="text-slate-400 italic">N/A</span>;
                      
                      if (response && response.answer) {
                        if (q.questionType === 'file') {
                           content = (
                             <button 
                               onClick={() => setPreviewDoc({ answer: response.answer, title: q.questionText })}
                               className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-1 rounded-lg border border-blue-100"
                             >
                               <Eye className="h-3.5 w-3.5" />
                               View
                             </button>
                           );
                        } else {
                           const textVal = Array.isArray(response.answer) ? response.answer.join(', ') : String(response.answer);
                           if (textVal.length > 30) {
                             content = (
                               <div className="group relative cursor-pointer">
                                 <span className="truncate block max-w-[200px] text-slate-700">{textVal.substring(0, 30)}...</span>
                                 <div className="absolute z-10 hidden group-hover:block w-64 p-2 mt-1 bg-slate-900 text-white text-xs rounded-lg shadow-xl whitespace-normal break-words -left-1/2">
                                   {textVal}
                                 </div>
                               </div>
                             );
                           } else {
                             content = <span className="text-slate-700">{textVal}</span>;
                           }
                        }
                      }

                      return (
                        <td key={q._id} className="px-6 py-4 whitespace-nowrap">
                          {content}
                        </td>
                      );
                    })}

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedReg(reg)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Response Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">Student Registration Details</h2>
              <button 
                onClick={() => setSelectedReg(null)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Student</p>
                  <p className="text-sm font-bold text-slate-900">{selectedReg.student?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Enrollment</p>
                  <p className="text-sm font-mono font-bold text-slate-900">{selectedReg.student?.enrollmentNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Department</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedReg.student?.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedReg.student?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Additional Questions */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2">Additional Questions</h3>
                {selectedReg.customResponses && selectedReg.customResponses.length > 0 ? (
                  <div className="space-y-6">
                    {selectedReg.customResponses.map((response, index) => (
                      <div key={index} className="space-y-2">
                        <p className="text-sm font-semibold text-slate-900">
                          <span className="text-blue-600 mr-2">Q{index + 1}.</span>
                          {response.questionText}
                        </p>
                        <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-3">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {Array.isArray(response.answer) ? response.answer.join(', ') : (response.answer || 'Not Answered')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No additional questions were asked for this event.</p>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedReg(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex flex-col">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold truncate max-w-md">{previewDoc.title || 'Attachment Preview'}</h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="h-8 w-8 rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-auto p-4 min-h-[50vh]">
              {previewDoc.answer.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={getFullAssetUrl(previewDoc.answer)}
                  className="w-full h-[65vh] border-0 rounded-2xl bg-white"
                  title="PDF Preview"
                />
              ) : previewDoc.answer.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                <img
                  src={getFullAssetUrl(previewDoc.answer)}
                  alt="Attachment Preview"
                  className="max-w-full max-h-[65vh] object-contain rounded-lg"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  <p>Preview not supported for this file type.</p>
                  <a
                    href={getFullAssetUrl(previewDoc.answer)}
                    download
                    target="_blank"
                    rel="noreferrer"
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
    </div>
  );
};

export default ViewRegistrations;
