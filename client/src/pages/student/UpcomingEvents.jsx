import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, CalendarDays, MapPin, Users, Ticket, CheckCircle, Clock, UserCheck, Plus, Trash2, X, AlertTriangle, Layers, Sparkles } from 'lucide-react';
import { getFullAssetUrl } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const UpcomingEvents = () => {
  const { user } = useAuth();

  // Primary Data States
  const [allEvents, setAllEvents] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // UI exploration state for multiple events (Festival details modal)
  const [activeFestivalDetails, setActiveFestivalDetails] = useState(null);

  // Registration Modal States
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [regChoice, setRegChoice] = useState(''); // 'Individual' | 'Team'
  const [customAnswers, setCustomAnswers] = useState({});

  // Team Form States
  const [teamName, setTeamName] = useState('');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [department, setDepartment] = useState(user?.department || 'IT');
  const [teamMembers, setTeamMembers] = useState([{ name: '', email: '', department: '', enrollmentNumber: '', contactNumber: '' }]);
  const [mentorName, setMentorName] = useState('');
  const [mentorDept, setMentorDept] = useState('');

  const handleCustomAnswerChange = (qText, val) => {
    setCustomAnswers((prev) => ({ ...prev, [qText]: val }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const deptMap = {
        'CE': 'Computer Engineering',
        'IT': 'Information Technology',
        'CIVIL': 'Civil Engineering',
        'MECH': 'Mechanical Engineering',
        'EE': 'Electrical Engineering',
        'EC': 'Electronics & Communication',
        'AUTO': 'Automobile Engineering'
      };
      const userDeptFull = user?.department ? deptMap[user.department] : '';
      
      // Filter events by eligible department
      const eventQuery = userDeptFull ? `status=Published&eligibleDepartments=${encodeURIComponent(userDeptFull)}` : 'status=Published';
      const eventsRes = await axios.get(`/api/events?${eventQuery}`);
      
      const festRes = await axios.get('/api/festivals');
      const regsRes = await axios.get('/api/registrations/my-registrations');

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
      if (regsRes.data.success) {
        setRegistrations(regsRes.data.registrations || []);
      }
    } catch (err) {
      console.error('Failed to load events data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Standalone Events vs Festival Child Events
  const unifiedEventsList = useMemo(() => {
    const standalone = allEvents.filter((e) => !e.festival);
    const festItems = festivals.map((f) => ({ ...f, isFestival: true }));
    return [...standalone, ...festItems];
  }, [allEvents, festivals]);

  const filteredUnifiedList = useMemo(() => {
    return unifiedEventsList.filter((item) => {
      const titleText = item.isFestival ? item.name : item.title;
      const venueText = item.venue || '';
      const matchesSearch =
        titleText.toLowerCase().includes(search.toLowerCase()) ||
        venueText.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = typeFilter === '' ? true : (item.isFestival ? false : item.type === typeFilter);
      const isActive = item.status !== 'Completed' && item.status !== 'Cancelled';
      return matchesSearch && matchesType && isActive;
    });
  }, [unifiedEventsList, search, typeFilter]);

  const openRegistrationModal = (event) => {
    // Check if registering for a sub-event of a festival, and check if festival allows multiple registrations
    if (event.festival) {
      const parentFest = festivals.find(f => f._id === (event.festival._id || event.festival));
      if (parentFest && parentFest.allowMultipleRegistrations === false) {
        // Find if this student has registered for any sub-event under this festival
        const childIds = allEvents.filter(e => e.festival === parentFest._id || e.festival?._id === parentFest._id).map(e => e._id);
        const alreadyReg = registrations.find(r => childIds.includes(r.event?._id || r.event));
        if (alreadyReg) {
          alert(`You are already registered for "${alreadyReg.event?.title || 'an event'}" in the "${parentFest.name}" festival. Multiple registrations are disabled for this festival.`);
          return;
        }
      }
    }

    setActiveModalEvent(event);
    setCustomAnswers({});
    setModalError('');
    setTeamName('');
    setContactNumber(user?.contactNumber || '');
    setDepartment(user?.department || 'IT');
    setTeamMembers([{ name: '', email: '', department: '', enrollmentNumber: '', contactNumber: '' }]);
    setMentorName('');
    setMentorDept('');

    if (event.registrationMode === 'Team') {
      setRegChoice('Team');
    } else if (event.registrationMode === 'Individual') {
      setRegChoice('Individual');
    } else {
      setRegChoice('');
    }
  };

  const handleAddMember = () => {
    const config = activeModalEvent?.registrationConfig || {};
    const maxTotal = config.maxTeamMembers || 5;
    if (teamMembers.length + 1 >= maxTotal) {
      return setModalError(`Maximum allowed team size is ${maxTotal} members.`);
    }
    setTeamMembers([...teamMembers, { name: '', email: '', department: '', enrollmentNumber: '', contactNumber: '' }]);
  };

  const handleRemoveMember = (idx) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== idx));
  };

  const handleMemberChange = (idx, field, val) => {
    const next = [...teamMembers];
    next[idx][field] = val;
    setTeamMembers(next);
  };

  const submitRegistration = async (e) => {
    if (e) e.preventDefault();
    if (!activeModalEvent) return;

    setModalError('');
    const event = activeModalEvent;
    const mode = regChoice || event.registrationMode || 'Individual';

    if (mode === 'Team') {
      if (!teamName.trim()) {
        return setModalError('Please enter your Team Name.');
      }

      const totalCount = teamMembers.length + 1;
      const minSize = event.registrationConfig?.minTeamMembers || 2;
      const maxSize = event.registrationConfig?.maxTeamMembers || 5;

      if (totalCount < minSize) {
        return setModalError(`Team requires at least ${minSize} members (including Team Leader). You currently have ${totalCount}.`);
      }
      if (totalCount > maxSize) {
        return setModalError(`Team cannot exceed ${maxSize} members. You currently have ${totalCount}.`);
      }
    }

    // Collect and validate custom responses
    const customResponsesList = [];
    if (event.customQuestions && event.customQuestions.length > 0) {
      for (const q of event.customQuestions) {
        const val = customAnswers[q.questionText];
        const isAnswered = Array.isArray(val) ? val.length > 0 : val !== undefined && val !== null && String(val).trim() !== '';
        if (q.required && !isAnswered) {
          return setModalError(`Answer for "${q.questionText}" is required.`);
        }
        customResponsesList.push({
          questionId: q._id,
          questionType: q.questionType,
          questionText: q.questionText,
          answer: val || ''
        });
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        eventId: event._id,
        registrationType: mode,
        teamName: mode === 'Team' ? teamName : undefined,
        teamMembers: mode === 'Team' ? teamMembers : undefined,
        contactNumber,
        department,
        facultyMentor: mode === 'Team' && mentorName ? { name: mentorName, department: mentorDept } : undefined,
        customResponses: customResponsesList
      };

      const res = await axios.post('/api/registrations', payload);
      setSubmitting(false);

      if (res.data.success) {
        alert(res.data.message);
        setActiveModalEvent(null);
        fetchData();
      }
    } catch (err) {
      setSubmitting(false);
      setModalError(err.response?.data?.message || 'Registration failed.');
    }
  };

  const isRegistered = (eventId) => {
    return registrations.some((r) => r.event?._id === eventId);
  };

  const [fileUploadingMap, setFileUploadingMap] = useState({});

  const handleFileUploadQuestion = async (qText, file) => {
    if (!file) return;
    setFileUploadingMap((prev) => ({ ...prev, [qText]: true }));
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('/api/media/upload-registration-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        handleCustomAnswerChange(qText, res.data.fileUrl);
      }
    } catch (err) {
      alert('Failed to upload file. Please try again.');
    } finally {
      setFileUploadingMap((prev) => ({ ...prev, [qText]: false }));
    }
  };

  const renderCustomQuestionsFields = () => {
    if (!activeModalEvent?.customQuestions || activeModalEvent.customQuestions.length === 0) return null;

    return (
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-left animate-fadeIn">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Additional Registration Questions
        </h4>
        {activeModalEvent.customQuestions.map((q, idx) => (
          <div key={idx} className="space-y-1.5 text-left">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {q.questionText} {q.required && <span className="text-red-500">*</span>}
            </label>
            
            {(q.questionType === 'text' || q.questionType === 'shortText') && (
              <input
                type="text"
                required={q.required}
                value={customAnswers[q.questionText] || ''}
                onChange={(e) => handleCustomAnswerChange(q.questionText, e.target.value)}
                placeholder="Your answer..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            )}

            {q.questionType === 'paragraph' && (
              <textarea
                rows="3"
                required={q.required}
                value={customAnswers[q.questionText] || ''}
                onChange={(e) => handleCustomAnswerChange(q.questionText, e.target.value)}
                placeholder="Write your answer..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            )}

            {q.questionType === 'number' && (
              <input
                type="number"
                required={q.required}
                value={customAnswers[q.questionText] || ''}
                onChange={(e) => handleCustomAnswerChange(q.questionText, e.target.value)}
                placeholder="Enter number..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            )}

            {q.questionType === 'email' && (
              <input
                type="email"
                required={q.required}
                value={customAnswers[q.questionText] || ''}
                onChange={(e) => handleCustomAnswerChange(q.questionText, e.target.value)}
                placeholder="Enter email address..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            )}

            {q.questionType === 'phone' && (
              <input
                type="tel"
                required={q.required}
                value={customAnswers[q.questionText] || ''}
                onChange={(e) => handleCustomAnswerChange(q.questionText, e.target.value)}
                placeholder="Enter phone number..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            )}

            {q.questionType === 'date' && (
              <input
                type="date"
                required={q.required}
                value={customAnswers[q.questionText] || ''}
                onChange={(e) => handleCustomAnswerChange(q.questionText, e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            )}

            {q.questionType === 'time' && (
              <input
                type="time"
                required={q.required}
                value={customAnswers[q.questionText] || ''}
                onChange={(e) => handleCustomAnswerChange(q.questionText, e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            )}

            {q.questionType === 'dropdown' && (
              <select
                required={q.required}
                value={customAnswers[q.questionText] || ''}
                onChange={(e) => handleCustomAnswerChange(q.questionText, e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="">Select option...</option>
                {q.options.map((opt, optIdx) => (
                  <option key={optIdx} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {q.questionType === 'checkbox' && (
              <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800">
                {q.options.map((opt, optIdx) => {
                  const currentAnswers = customAnswers[q.questionText] || [];
                  const isChecked = currentAnswers.includes(opt);
                  return (
                    <label key={optIdx} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let nextAnswers = [...currentAnswers];
                          if (e.target.checked) {
                            nextAnswers.push(opt);
                          } else {
                            nextAnswers = nextAnswers.filter(a => a !== opt);
                          }
                          handleCustomAnswerChange(q.questionText, nextAnswers);
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {q.questionType === 'radio' && (
              <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800">
                {q.options.map((opt, optIdx) => (
                  <label key={optIdx} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name={`question-${idx}`}
                      checked={customAnswers[q.questionText] === opt}
                      onChange={() => handleCustomAnswerChange(q.questionText, opt)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.questionType === 'file' && (
              <div className="space-y-2">
                <input
                  type="file"
                  onChange={(e) => handleFileUploadQuestion(q.questionText, e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                />
                {fileUploadingMap[q.questionText] && (
                  <p className="text-[10px] text-blue-500 font-semibold animate-pulse">Uploading attachment...</p>
                )}
                {customAnswers[q.questionText] && (
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Attachment Staged Successfully!
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
          Upcoming Events Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Explore technical workshops, competitions, hackathons, sports, and register as an individual or team.
        </p>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs font-bold text-slate-400">Loading upcoming events...</div>
        ) : filteredUnifiedList.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs font-bold text-slate-400">
            No upcoming events available.
          </div>
        ) : (
          filteredUnifiedList.map((item) => {
            if (item.isFestival) {
               const posterUrl = item.banner ? getFullAssetUrl(item.banner) : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
               const childEventsCount = allEvents.filter(e => e.festival === item._id || e.festival?._id === item._id).length;

               return (
                 <div key={item._id} className="flex flex-col overflow-hidden rounded-3xl border border-purple-200 dark:border-purple-900 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                   <div className="relative h-44 bg-slate-950">
                     <img
                       src={posterUrl}
                       alt={item.name}
                       className="h-full w-full object-cover"
                       onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'; }}
                     />
                     <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-purple-600 text-white text-[10px] font-extrabold shadow-sm border border-purple-500">
                       Multi Event
                     </span>
                   </div>

                   <div className="flex-1 p-5 space-y-4">
                     <div>
                       <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h3>
                       <p className="mt-1 text-[10px] font-extrabold text-purple-500 uppercase tracking-wider">{item.theme || 'Multi Event'}</p>
                     </div>

                    <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-purple-500" />
                        <span>{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-purple-500" />
                        <span className="truncate">{item.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-purple-500" />
                        <span>{childEventsCount} Sub-Events Included</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4">
                    <button
                      onClick={() => setActiveFestivalDetails(item)}
                      className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 py-2.5 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:scale-102"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Explore & Register</span>
                    </button>
                  </div>
                </div>
              );
            }

            const registered = isRegistered(item._id);
            const isFull = item.capacity && item.registrationCount >= item.capacity;
            const deadlinePassed = new Date(item.lastRegistrationDate) < new Date();
            const mode = item.registrationMode || 'Individual';

            return (
              <div key={item._id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                <div className="relative h-44 bg-slate-950">
                  <img
                    src={getFullAssetUrl(item.poster)}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'; }}
                  />
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-extrabold text-blue-400 border border-white/10 shadow-sm">
                    {mode} Reg.
                  </span>
                  {registered && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold text-white shadow-sm">
                      <CheckCircle className="h-3 w-3" />
                      <span>Registered</span>
                    </span>
                  )}
                </div>

                <div className="flex-1 p-5 space-y-4">
                  <div>
                    <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</h3>
                    <p className="mt-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{item.type}</p>
                  </div>

                  <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-blue-500" />
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="truncate">{item.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{item.registrationCount} {item.capacity ? `/ ${item.capacity}` : ''} Participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                      <Clock className="h-4 w-4" />
                      <span>Deadline: {new Date(item.lastRegistrationDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4">
                  {registered ? (
                    <button
                      disabled
                      className="w-full rounded-xl bg-emerald-100 dark:bg-emerald-950/50 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Already Registered</span>
                    </button>
                  ) : deadlinePassed ? (
                    <button
                      disabled
                      className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-400 cursor-not-allowed"
                    >
                      Registration Closed
                    </button>
                  ) : isFull ? (
                    <button
                      disabled
                      className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold text-red-500 cursor-not-allowed"
                    >
                      Event Full
                    </button>
                  ) : (
                    <button
                      onClick={() => openRegistrationModal(item)}
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:scale-102"
                    >
                      <Ticket className="h-4 w-4" />
                      <span>Register Now</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MULTI EVENT EXPLORE MODAL */}
      {activeFestivalDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Multi Event
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                  {activeFestivalDetails.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveFestivalDetails(null)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Multi Event Banner & Details */}
              <div className="md:col-span-1 space-y-4">
                <div className="rounded-2xl overflow-hidden h-40 bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <img
                    src={activeFestivalDetails.banner ? getFullAssetUrl(activeFestivalDetails.banner) : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
                    alt={activeFestivalDetails.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <p className="text-sm font-bold text-slate-950 dark:text-white">{activeFestivalDetails.theme}</p>
                  <p>{activeFestivalDetails.description}</p>
                  <div className="flex items-center gap-2 pt-2 text-[11px] font-extrabold text-slate-500 uppercase">
                    <MapPin className="h-3.5 w-3.5 text-purple-500" />
                    <span>{activeFestivalDetails.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-500 uppercase">
                    <CalendarDays className="h-3.5 w-3.5 text-purple-500" />
                    <span>{new Date(activeFestivalDetails.startDate).toLocaleDateString()} - {new Date(activeFestivalDetails.endDate).toLocaleDateString()}</span>
                  </div>
                  {activeFestivalDetails.allowMultipleRegistrations === false && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-bold">
                      Note: You can register for only ONE sub-event in this multi event.
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-Events List */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Select a Sub-Event to Register
                </h4>
                
                <div className="space-y-3 overflow-y-auto max-h-[45vh] pr-2">
                  {allEvents.filter(e => e.festival === activeFestivalDetails._id || e.festival?._id === activeFestivalDetails._id).length === 0 ? (
                    <div className="text-center text-xs font-bold text-slate-400 py-12">
                      No sub-events scheduled yet for this festival.
                    </div>
                  ) : (
                    allEvents
                      .filter(e => e.festival === activeFestivalDetails._id || e.festival?._id === activeFestivalDetails._id)
                      .map((subEvent) => {
                        const registered = isRegistered(subEvent._id);
                        const isFull = subEvent.capacity && subEvent.registrationCount >= subEvent.capacity;
                        const deadlinePassed = new Date(subEvent.lastRegistrationDate) < new Date();

                        return (
                          <div key={subEvent._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                                {subEvent.type}
                              </span>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{subEvent.title}</h5>
                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                <span>{new Date(subEvent.date).toLocaleDateString()} ({subEvent.startTime} - {subEvent.endTime})</span>
                                <span>•</span>
                                <span>{subEvent.venue}</span>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center">
                              {registered ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold text-white shadow-sm">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Registered</span>
                                </span>
                              ) : deadlinePassed ? (
                                <span className="text-xs font-bold text-slate-400">Closed</span>
                              ) : isFull ? (
                                <span className="text-xs font-bold text-red-500">Full</span>
                              ) : (
                                <button
                                  onClick={() => openRegistrationModal(subEvent)}
                                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-102"
                                >
                                  Register
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Event Registration Portal
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                  {activeModalEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalEvent(null)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {activeModalEvent.registrationMode === 'Both' && !regChoice && (
              <div className="space-y-4 text-center py-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                  How would you like to register for this event?
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setRegChoice('Individual')}
                    className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-950 text-center transition-all cursor-pointer hover:scale-102"
                  >
                    <UserCheck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Register As Individual</span>
                    <span className="text-[10px] text-slate-500">Participate on your own</span>
                  </button>

                  <button
                    onClick={() => setRegChoice('Team')}
                    className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-purple-600 dark:hover:border-purple-500 bg-slate-50 dark:bg-slate-950 text-center transition-all cursor-pointer hover:scale-102"
                  >
                    <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Register As Team</span>
                    <span className="text-[10px] text-slate-500">Form a team with peers</span>
                  </button>
                </div>
              </div>
            )}

            {regChoice === 'Individual' && (
              <form onSubmit={submitRegistration} className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-xs text-blue-800 dark:text-blue-200">
                  You are registering individually for <strong>{activeModalEvent.title}</strong> as <strong>{user?.name}</strong> ({user?.enrollmentNumber || user?.email}).
                </div>

                {renderCustomQuestionsFields()}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalEvent(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 cursor-pointer"
                  >
                    {submitting ? 'Confirming...' : 'Confirm Registration'}
                  </button>
                </div>
              </form>
            )}

            {regChoice === 'Team' && (
              <form onSubmit={submitRegistration} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Cyber Knights / Tech Titans"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Team Leader Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || ''}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="9988776655"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Team Members ({teamMembers.length + 1} / {activeModalEvent.registrationConfig?.maxTeamMembers || 5})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Member
                    </button>
                  </div>

                  {teamMembers.map((member, idx) => (
                    <div key={idx} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Member #{idx + 2}
                        </span>
                        {teamMembers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={member.name}
                          onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                          placeholder="Member Name..."
                          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={member.enrollmentNumber}
                          onChange={(e) => handleMemberChange(idx, 'enrollmentNumber', e.target.value)}
                          placeholder="Enrollment No..."
                          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {renderCustomQuestionsFields()}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveModalEvent(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-500/25 cursor-pointer"
                  >
                    {submitting ? 'Registering Team...' : 'Submit Team Registration'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents;
