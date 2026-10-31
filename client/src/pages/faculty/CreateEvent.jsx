import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarPlus,
  Plus,
  Trash2,
  ShieldAlert,
  Users,
  UserCheck,
  ArrowLeft,
  CheckCircle2,
  User,
  Layers,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Copy,
  Settings,
  HelpCircle,
  X,
  Edit2,
  Search,
  Check
} from 'lucide-react';
import UserAutocomplete from '../../components/UserAutocomplete';

const DEPARTMENTS_LIST = [
  'Computer Engineering',
  'Information Technology',
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Electronics & Communication',
  'Automobile Engineering'
];

const ORGANIZERS_LIST = [
  'Coding Club',
  'AI Club',
  'Robotics Club',
  'Cyber Security Club',
  'IEEE Student Branch',
  'ISTE Student Chapter',
  'Google Developer Student Club (GDSC)',
  'NSS',
  'NCC',
  'Entrepreneurship Cell',
  'Innovation Cell',
  'Training & Placement Cell',
  'Cultural Committee',
  'Sports Committee',
  'Technical Committee',
  'Research Cell',
  'Student Council',
  'Department Association',
  'Women Development Cell',
  'Alumni Association',
  'Other (Custom)'
];

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editFestivalId = searchParams.get('editFestivalId');
  const editEventId = searchParams.get('editEventId');
  const festivalId = searchParams.get('festivalId');

  // Unified Event Type selection
  const [eventType, setEventType] = useState('Single'); // 'Single' | 'Multiple'

  // Parent Festival States (Only for Multiple Event)
  const [festName, setFestName] = useState('');
  const [festTheme, setFestTheme] = useState('');
  const [festDescription, setFestDescription] = useState('');
  const [festVenue, setFestVenue] = useState('');
  const [festStartDate, setFestStartDate] = useState('');
  const [festEndDate, setFestEndDate] = useState('');
  const [festBanner, setFestBanner] = useState(null);
  const [allowMultipleRegistrations, setAllowMultipleRegistrations] = useState(true);
  const [overallFacultyCoordinator, setOverallFacultyCoordinator] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contactNumber: ''
  });

  // Standalone / Sub-Event States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Technical');
  const [customType, setCustomType] = useState('');
  const [eligibleDepartments, setEligibleDepartments] = useState(['All Departments']);
  const [organizedBy, setOrganizedBy] = useState('');
  const [customOrganizedBy, setCustomOrganizedBy] = useState('');
  const [isOrganizerDropdownOpen, setIsOrganizerDropdownOpen] = useState(false);
  const [organizerSearch, setOrganizerSearch] = useState('');
  const [isSubOrganizerDropdownOpen, setIsSubOrganizerDropdownOpen] = useState(false);
  const [subOrganizerSearch, setSubOrganizerSearch] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [lastRegistrationDate, setLastRegistrationDate] = useState('');
  const [registrationMode, setRegistrationMode] = useState('Individual');
  const [maxIndividualParticipants, setMaxIndividualParticipants] = useState('');
  const [minTeamMembers, setMinTeamMembers] = useState('2');
  const [maxTeamMembers, setMaxTeamMembers] = useState('5');
  const [maxTeamsCount, setMaxTeamsCount] = useState('');
  const [requireTeamLeader, setRequireTeamLeader] = useState(true);
  const [faculties, setFaculties] = useState([{ id: null }]);
  const [students, setStudents] = useState([{ id: null }]);
  const [poster, setPoster] = useState(null);
  const [customQuestions, setCustomQuestions] = useState([]);

  // Sub-Events Array for Multiple Event type
  const [subEvents, setSubEvents] = useState([]);
  const [editingSubEventIdx, setEditingSubEventIdx] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load edit mode details if editing
  useEffect(() => {
    if (editEventId) {
      fetchEventDetails();
    } else if (editFestivalId) {
      setEventType('Multiple');
      fetchFestivalDetails();
    } else if (festivalId) {
      setEventType('Single');
    }
  }, [editEventId, editFestivalId, festivalId]);

  const fetchEventDetails = async () => {
    try {
      const res = await axios.get(`/api/events/${editEventId}`);
      if (res.data.success) {
        const ev = res.data.event;
        setEventType('Single');
        setTitle(ev.title);
        setDescription(ev.description);
        setType(ev.type);
        setCustomType(ev.customType || '');
        if (ev.eligibleDepartments && ev.eligibleDepartments.length > 0) {
          setEligibleDepartments(ev.eligibleDepartments);
        } else {
          setEligibleDepartments(['All Departments']);
        }

        if (ORGANIZERS_LIST.includes(ev.organizedBy)) {
          setOrganizedBy(ev.organizedBy);
        } else if (ev.organizedBy) {
          setOrganizedBy('Other (Custom)');
          setCustomOrganizedBy(ev.organizedBy);
        }
        setVenue(ev.venue);
        setDate(ev.date ? ev.date.split('T')[0] : '');
        setStartTime(ev.startTime);
        setEndTime(ev.endTime);
        setLastRegistrationDate(ev.lastRegistrationDate ? ev.lastRegistrationDate.split('T')[0] : '');
        setRegistrationMode(ev.registrationMode);
        if (ev.registrationConfig) {
          setMaxIndividualParticipants(ev.registrationConfig.maxIndividualParticipants || '');
          setMinTeamMembers(ev.registrationConfig.minTeamMembers || '2');
          setMaxTeamMembers(ev.registrationConfig.maxTeamMembers || '5');
          setMaxTeamsCount(ev.registrationConfig.maxTeamsCount || '');
          setRequireTeamLeader(ev.registrationConfig.requireTeamLeader !== false);
        }
        setFaculties(ev.coordinators?.faculty?.length ? ev.coordinators.faculty : [{ name: '' }]);
        setStudents(ev.coordinators?.student?.length ? ev.coordinators.student : [{ name: '', contactNumber: '' }]);
        setCustomQuestions(ev.customQuestions || []);
      }
    } catch (err) {
      setError('Failed to fetch event details.');
    }
  };

  const fetchFestivalDetails = async () => {
    try {
      const res = await axios.get(`/api/festivals/${editFestivalId}`);
      if (res.data.success) {
        const fest = res.data.festival;
        setFestName(fest.name);
        setFestTheme(fest.theme || '');
        setFestDescription(fest.description);
        setFestVenue(fest.venue);
        setFestStartDate(fest.startDate ? fest.startDate.split('T')[0] : '');
        setFestEndDate(fest.endDate ? fest.endDate.split('T')[0] : '');
        setAllowMultipleRegistrations(fest.allowMultipleRegistrations !== false);
        setOverallFacultyCoordinator(fest.overallFacultyCoordinator || { name: '', email: '', contactNumber: '' });
        setSubEvents(fest.childEvents || []);
      }
    } catch (err) {
      setError('Failed to fetch festival details.');
    }
  };

  // Sub-Event Helpers
  const createEmptySubEvent = () => ({
    title: '',
    description: '',
    type: 'Technical',
    customType: '',
    eligibleDepartments: ['All Departments'],
    organizedBy: '',
    customOrganizedBy: '',
    isOrganizerDropdownOpen: false,
    organizerSearch: '',
    venue: '',
    date: '',
    startTime: '',
    endTime: '',
    lastRegistrationDate: '',
    capacity: '',
    registrationMode: 'Individual',
    registrationConfig: {
      maxIndividualParticipants: null,
      minTeamMembers: 2,
      maxTeamMembers: 5,
      maxTeamsCount: null,
      requireTeamLeader: true
    },
    coordinators: {
      faculty: [{ id: null }],
      student: [{ id: null }]
    },
    customQuestions: []
  });

  const handleAddSubEvent = () => {
    setSubEvents([...subEvents, createEmptySubEvent()]);
    setEditingSubEventIdx(subEvents.length);
  };

  const handleDuplicateSubEvent = (idx) => {
    const cloned = JSON.parse(JSON.stringify(subEvents[idx]));
    delete cloned._id; // Remove ID to generate a new one
    cloned.title = `${cloned.title} (Copy)`;
    setSubEvents([...subEvents, cloned]);
  };

  const handleDeleteSubEvent = (idx) => {
    if (window.confirm('Remove this sub-event?')) {
      setSubEvents(subEvents.filter((_, i) => i !== idx));
    }
  };

  // Custom question helpers
  const addCustomQuestion = (isSubEvent = false) => {
    if (isSubEvent) {
      const next = [...subEvents];
      next[editingSubEventIdx].customQuestions.push({
        questionText: '',
        questionType: 'text',
        options: [''],
        required: false
      });
      setSubEvents(next);
    } else {
      setCustomQuestions([
        ...customQuestions,
        { questionText: '', questionType: 'text', options: [''], required: false }
      ]);
    }
  };

  const removeCustomQuestion = (idx, isSubEvent = false) => {
    if (isSubEvent) {
      const next = [...subEvents];
      next[editingSubEventIdx].customQuestions = next[editingSubEventIdx].customQuestions.filter((_, i) => i !== idx);
      setSubEvents(next);
    } else {
      setCustomQuestions(customQuestions.filter((_, i) => i !== idx));
    }
  };

  const updateQuestionText = (idx, val, isSubEvent = false) => {
    if (isSubEvent) {
      const next = [...subEvents];
      next[editingSubEventIdx].customQuestions[idx].questionText = val;
      setSubEvents(next);
    } else {
      const next = [...customQuestions];
      next[idx].questionText = val;
      setCustomQuestions(next);
    }
  };

  const updateQuestionType = (idx, val, isSubEvent = false) => {
    if (isSubEvent) {
      const next = [...subEvents];
      next[editingSubEventIdx].customQuestions[idx].questionType = val;
      if (val === 'text') next[editingSubEventIdx].customQuestions[idx].options = [''];
      setSubEvents(next);
    } else {
      const next = [...customQuestions];
      next[idx].questionType = val;
      if (val === 'text') next[idx].options = [''];
      setCustomQuestions(next);
    }
  };

  const toggleQuestionRequired = (idx, isSubEvent = false) => {
    if (isSubEvent) {
      const next = [...subEvents];
      next[editingSubEventIdx].customQuestions[idx].required = !next[editingSubEventIdx].customQuestions[idx].required;
      setSubEvents(next);
    } else {
      const next = [...customQuestions];
      next[idx].required = !next[idx].required;
      setCustomQuestions(next);
    }
  };

  const addQuestionOption = (qIdx, isSubEvent = false) => {
    if (isSubEvent) {
      const next = [...subEvents];
      next[editingSubEventIdx].customQuestions[qIdx].options.push('');
      setSubEvents(next);
    } else {
      const next = [...customQuestions];
      next[qIdx].options.push('');
      setCustomQuestions(next);
    }
  };

  const removeQuestionOption = (qIdx, oIdx, isSubEvent = false) => {
    if (isSubEvent) {
      const next = [...subEvents];
      next[editingSubEventIdx].customQuestions[qIdx].options = next[editingSubEventIdx].customQuestions[qIdx].options.filter((_, i) => i !== oIdx);
      setSubEvents(next);
    } else {
      const next = [...customQuestions];
      next[qIdx].options = next[qIdx].options.filter((_, i) => i !== oIdx);
      setCustomQuestions(next);
    }
  };

  const updateQuestionOption = (qIdx, oIdx, val, isSubEvent = false) => {
    if (isSubEvent) {
      const next = [...subEvents];
      next[editingSubEventIdx].customQuestions[qIdx].options[oIdx] = val;
      setSubEvents(next);
    } else {
      const next = [...customQuestions];
      next[qIdx].options[oIdx] = val;
      setCustomQuestions(next);
    }
  };

  const moveQuestion = (idx, direction, isSubEvent = false) => {
    const list = isSubEvent ? subEvents[editingSubEventIdx].customQuestions : customQuestions;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const nextList = [...list];
    const temp = nextList[idx];
    nextList[idx] = nextList[targetIdx];
    nextList[targetIdx] = temp;

    if (isSubEvent) {
      const next = [...subEvents];
      next[editingSubEventIdx].customQuestions = nextList;
      setSubEvents(next);
    } else {
      setCustomQuestions(nextList);
    }
  };

  const duplicateQuestion = (idx, isSubEvent = false) => {
    const list = isSubEvent ? subEvents[editingSubEventIdx].customQuestions : customQuestions;
    const q = list[idx];
    const cloned = { ...JSON.parse(JSON.stringify(q)), questionText: `${q.questionText} (Copy)` };

    const nextList = [
      ...list.slice(0, idx + 1),
      cloned,
      ...list.slice(idx + 1)
    ];

    if (isSubEvent) {
      const next = [...subEvents];
      next[editingSubEventIdx].customQuestions = nextList;
      setSubEvents(next);
    } else {
      setCustomQuestions(nextList);
    }
  };

  // Standalone Coordinator functions
  const addFaculty = () => setFaculties([...faculties, { id: null }]);
  const removeFaculty = (idx) => setFaculties(faculties.filter((_, i) => i !== idx));
  const updateFaculty = (idx, val) => {
    const next = [...faculties];
    next[idx].id = val;
    setFaculties(next);
  };

  const addStudent = () => setStudents([...students, { id: null }]);
  const removeStudent = (idx) => setStudents(students.filter((_, i) => i !== idx));
  const updateStudent = (idx, val) => {
    const next = [...students];
    next[idx].id = val;
    setStudents(next);
  };

  // Sub-Event Coordinator functions
  const addSubFaculty = () => {
    const next = [...subEvents];
    next[editingSubEventIdx].coordinators.faculty.push({ id: null });
    setSubEvents(next);
  };
  const removeSubFaculty = (idx) => {
    const next = [...subEvents];
    next[editingSubEventIdx].coordinators.faculty = next[editingSubEventIdx].coordinators.faculty.filter((_, i) => i !== idx);
    setSubEvents(next);
  };
  const updateSubFaculty = (idx, val) => {
    const next = [...subEvents];
    next[editingSubEventIdx].coordinators.faculty[idx].id = val;
    setSubEvents(next);
  };

  const addSubStudent = () => {
    const next = [...subEvents];
    next[editingSubEventIdx].coordinators.student.push({ id: null });
    setSubEvents(next);
  };
  const removeSubStudent = (idx) => {
    const next = [...subEvents];
    next[editingSubEventIdx].coordinators.student = next[editingSubEventIdx].coordinators.student.filter((_, i) => i !== idx);
    setSubEvents(next);
  };
  const updateSubStudent = (idx, val) => {
    const next = [...subEvents];
    next[editingSubEventIdx].coordinators.student[idx].id = val;
    setSubEvents(next);
  };

  const toggleDepartment = (dept) => {
    if (dept === 'All Departments') {
      if (eligibleDepartments.includes('All Departments')) {
        setEligibleDepartments([]);
      } else {
        setEligibleDepartments(['All Departments']);
      }
      return;
    }

    let next = [...eligibleDepartments];
    if (next.includes('All Departments')) {
      next = next.filter(d => d !== 'All Departments');
    }

    if (next.includes(dept)) {
      next = next.filter(d => d !== dept);
      if (next.length === 0) next = ['All Departments'];
    } else {
      next.push(dept);
      if (next.length === DEPARTMENTS_LIST.length) {
        next = ['All Departments'];
      }
    }
    setEligibleDepartments(next);
  };

  const toggleSubDepartment = (dept) => {
    const current = subEvents[editingSubEventIdx].eligibleDepartments || ['All Departments'];
    let next = [...current];

    if (dept === 'All Departments') {
      if (next.includes('All Departments')) {
        next = [];
      } else {
        next = ['All Departments'];
      }
    } else {
      if (next.includes('All Departments')) {
        next = next.filter(d => d !== 'All Departments');
      }

      if (next.includes(dept)) {
        next = next.filter(d => d !== dept);
        if (next.length === 0) next = ['All Departments'];
      } else {
        next.push(dept);
        if (next.length === DEPARTMENTS_LIST.length) {
          next = ['All Departments'];
        }
      }
    }

    const newSubEvents = [...subEvents];
    newSubEvents[editingSubEventIdx].eligibleDepartments = next;
    setSubEvents(newSubEvents);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (eventType === 'Single') {
      // Validate standalone event
      const start = new Date(`${date}T${startTime || '00:00'}`);
      const end = new Date(`${date}T${endTime || '00:00'}`);
      if (end <= start) {
        return setError('Event end time must be after the start time.');
      }
      if (new Date(lastRegistrationDate) > new Date(date)) {
        return setError('Last registration date cannot be after the event date.');
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      if (type === 'Other') formData.append('customType', customType);

      formData.append('eligibleDepartments', JSON.stringify(eligibleDepartments));
      const finalOrganizer = organizedBy === 'Other (Custom)' ? customOrganizedBy : organizedBy;
      formData.append('organizedBy', finalOrganizer);

      formData.append('venue', venue);
      formData.append('date', date);
      formData.append('startTime', startTime);
      formData.append('endTime', endTime);
      formData.append('lastRegistrationDate', lastRegistrationDate);
      formData.append('registrationMode', registrationMode);

      const registrationConfig = {
        maxIndividualParticipants: maxIndividualParticipants ? parseInt(maxIndividualParticipants) : null,
        minTeamMembers: parseInt(minTeamMembers) || 2,
        maxTeamMembers: parseInt(maxTeamMembers) || 5,
        maxTeamsCount: maxTeamsCount ? parseInt(maxTeamsCount) : null,
        requireTeamLeader
      };
      formData.append('registrationConfig', JSON.stringify(registrationConfig));

      const coordinators = {
        faculty: faculties.filter((f) => f.id).map(f => f.id),
        student: students.filter((s) => s.id).map(s => s.id)
      };
      formData.append('coordinators', JSON.stringify(coordinators));

      const cleanedQuestions = customQuestions
        .map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: ['dropdown', 'checkbox', 'radio'].includes(q.questionType)
            ? q.options.filter((opt) => opt.trim() !== '')
            : [],
          required: q.required
        }))
        .filter((q) => q.questionText.trim() !== '');
      formData.append('customQuestions', JSON.stringify(cleanedQuestions));

      if (festivalId) {
        formData.append('festival', festivalId);
      }

      if (poster) formData.append('poster', poster);

      try {
        let res;
        if (editEventId) {
          res = await axios.put(`/api/events/${editEventId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          res = await axios.post('/api/events', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
        setLoading(false);
        if (res.data.success) {
          navigate('/faculty/manage-events');
        }
      } catch (err) {
        setLoading(false);
        setError(err.response?.data?.message || 'Failed to save event');
      }
    } else {
      // Validate festival parent event
      if (new Date(festEndDate) < new Date(festStartDate)) {
        return setError('Festival End Date cannot be before Start Date.');
      }
      if (subEvents.length === 0) {
        return setError('Please add at least one child event to this festival.');
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('name', festName);
      formData.append('theme', festTheme);
      formData.append('description', festDescription);
      formData.append('venue', festVenue);
      formData.append('startDate', festStartDate);
      formData.append('endDate', festEndDate);
      formData.append('allowMultipleRegistrations', allowMultipleRegistrations);
      formData.append('overallFacultyCoordinator', JSON.stringify(overallFacultyCoordinator));
      formData.append('participatingDepartments', JSON.stringify(['ALL']));

      // Filter subEvents fields & cleanup questions options
      const cleanedSubEvents = subEvents.map(sub => {
        const cleanedQs = (sub.customQuestions || [])
          .map(q => ({
            questionText: q.questionText,
            questionType: q.questionType,
            options: ['dropdown', 'checkbox', 'radio'].includes(q.questionType)
              ? (q.options || []).filter(opt => opt.trim() !== '')
              : [],
            required: q.required
          }))
          .filter(q => q.questionText.trim() !== '');

        const finalOrganizer = sub.organizedBy === 'Other (Custom)' ? sub.customOrganizedBy : sub.organizedBy;
        
        const cleanedCoordinators = {
          faculty: (sub.coordinators?.faculty || []).filter(f => f.id).map(f => f.id),
          student: (sub.coordinators?.student || []).filter(s => s.id).map(s => s.id)
        };

        return {
          ...sub,
          organizedBy: finalOrganizer,
          customQuestions: cleanedQs,
          coordinators: cleanedCoordinators
        };
      });

      formData.append('subEvents', JSON.stringify(cleanedSubEvents));

      if (festBanner) {
        formData.append('banner', festBanner);
      }

      try {
        let res;
        if (editFestivalId) {
          res = await axios.put(`/api/festivals/unified/${editFestivalId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          res = await axios.post('/api/festivals/unified', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
        setLoading(false);
        if (res.data.success) {
          navigate('/faculty/manage-events');
        }
      } catch (err) {
        setLoading(false);
        setError(err.response?.data?.message || 'Failed to save multi-event festival');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <button
            onClick={() => navigate('/faculty/manage-events')}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
            {editEventId || editFestivalId ? 'Edit Event Details' : 'Publish Institutional Event'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure standalone single activities or launch multi-event institutional festivals with progressive options.
          </p>
        </div>

        <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <CalendarPlus className="h-6 w-6" />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Unified Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Dynamic Type Selector card */}
        {!editEventId && !editFestivalId && !festivalId && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-heading">
              Select Event Structure Type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setEventType('Single')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${eventType === 'Single'
                  ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
              >
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-950 dark:text-white">Single Event</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    Create an independent event with its own registration, schedule, and resources.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setEventType('Multiple')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${eventType === 'Multiple'
                  ? 'border-purple-600 bg-purple-50/20 dark:bg-purple-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
              >
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-950 dark:text-white">Event Group</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    Launch an event container containing multiple sub-events with unified command dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION A: Single Event Fields */}
        {eventType === 'Single' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 font-heading">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span>Basic Event Details</span>
              </h3>
              <div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Event Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Code Odyssey 2026 / Robotics Contest"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Event Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                        >
                          <option value="Technical">Technical</option>
                          <option value="Non-Technical">Non-Technical</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Webinar">Webinar</option>
                          <option value="Sports">Sports</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {type === 'Other' && (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Custom Type
                          </label>
                          <input
                            type="text"
                            required
                            value={customType}
                            onChange={(e) => setCustomType(e.target.value)}
                            placeholder="Enter type..."
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Event Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Details about problem statements, tracks, rules, and eligibility..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 font-heading">
                  <Layers className="h-4 w-4 text-blue-500" />
                  <span>Organizers</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Organized By <span className="text-red-500">*</span>
                    </label>
                    <div
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between cursor-pointer"
                      onClick={() => setIsOrganizerDropdownOpen(!isOrganizerDropdownOpen)}
                    >
                      <span>{organizedBy || 'Select Organization'}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOrganizerDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isOrganizerDropdownOpen && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <Search className="h-4 w-4 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={organizerSearch}
                            onChange={(e) => setOrganizerSearch(e.target.value)}
                            placeholder="Search organizers..."
                            className="w-full bg-transparent text-xs outline-none text-slate-900 dark:text-white"
                            autoFocus
                          />
                        </div>
                        <ul className="max-h-60 overflow-y-auto">
                          {ORGANIZERS_LIST.filter(org => org.toLowerCase().includes(organizerSearch.toLowerCase())).map(org => (
                            <li
                              key={org}
                              onClick={() => { setOrganizedBy(org); setIsOrganizerDropdownOpen(false); setOrganizerSearch(''); }}
                              className={`p-3 text-xs cursor-pointer flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 ${organizedBy === org ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}
                            >
                              <span>{org}</span>
                              {organizedBy === org && <Check className="h-3 w-3" />}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {organizedBy === 'Other (Custom)' && (
                    <div className="animate-fadeIn">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Enter Organization / Club Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customOrganizedBy}
                        onChange={(e) => setCustomOrganizedBy(e.target.value)}
                        placeholder="e.g. Science Club"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 font-heading">
                  <CalendarPlus className="h-4 w-4 text-blue-500" />
                  <span>Schedule & Venue</span>
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Event Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-semibold text-slate-950 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Reg. Deadline <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={lastRegistrationDate}
                          onChange={(e) => setLastRegistrationDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-semibold text-slate-950 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Start Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          required
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-semibold text-slate-950 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          End Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          required
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-semibold text-slate-950 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Venue <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g. Computer Center Lab 3"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Event Poster Image {!editEventId && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        required={!editEventId}
                        onChange={(e) => setPoster(e.target.files[0])}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 font-heading">
                  <UserCheck className="h-4 w-4 text-blue-500" />
                  <span>Eligibility Criteria</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-4">
                    Eligible Departments <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${eligibleDepartments.includes('All Departments') ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}>
                      <input
                        type="checkbox"
                        checked={eligibleDepartments.includes('All Departments')}
                        onChange={() => toggleDepartment('All Departments')}
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">All Departments</span>
                    </label>

                    {DEPARTMENTS_LIST.map(dept => {
                      const isChecked = eligibleDepartments.includes(dept);
                      const isDisabled = eligibleDepartments.includes('All Departments');
                      return (
                        <label key={dept} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${isChecked ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300'}`}>
                          <input
                            type="checkbox"
                            disabled={isDisabled}
                            checked={isChecked}
                            onChange={() => toggleDepartment(dept)}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{dept}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>Registration Mode Configurations</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'Individual', title: 'Individual Registration', desc: 'Single participant' },
                    { id: 'Team', title: 'Team Registration', desc: 'Group participation' },
                    { id: 'Both', title: 'Both Individual & Team', desc: 'Choice to register solo or team' }
                  ].map((mode) => {
                    const isSelected = registrationMode === mode.id;
                    return (
                      <div
                        key={mode.id}
                        onClick={() => setRegistrationMode(mode.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected
                          ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-955 dark:text-white">{mode.title}</span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{mode.desc}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                  {(registrationMode === 'Individual' || registrationMode === 'Both') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Maximum Individual Seats (Capacity)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={maxIndividualParticipants}
                        onChange={(e) => setMaxIndividualParticipants(e.target.value)}
                        placeholder="Leave blank for unlimited"
                        className="w-full sm:w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  )}

                  {(registrationMode === 'Team' || registrationMode === 'Both') && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Min Team Size
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={minTeamMembers}
                            onChange={(e) => setMinTeamMembers(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Max Team Size
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={maxTeamMembers}
                            onChange={(e) => setMaxTeamMembers(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Max Teams Allowed
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={maxTeamsCount}
                            onChange={(e) => setMaxTeamsCount(e.target.value)}
                            placeholder="No limits if blank"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={requireTeamLeader}
                          onChange={(e) => setRequireTeamLeader(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Enforce designated Team Leader role</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Coordinators */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 font-heading">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>Event Coordinators</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Faculty Coordinator List</span>
                      <button type="button" onClick={addFaculty} className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1">
                        <Plus className="h-3.5 w-3.5" /> Add Faculty
                      </button>
                    </div>
                    {faculties.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <UserAutocomplete
                            role="Faculty"
                            value={f.id}
                            onChange={(val) => updateFaculty(i, val)}
                            placeholder="Search Faculty..."
                            label=""
                          />
                        </div>
                        {faculties.length > 1 && (
                          <button type="button" onClick={() => removeFaculty(i)} className="text-slate-400 hover:text-red-600 mt-1 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Student Coordinator List</span>
                      <button type="button" onClick={addStudent} className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1">
                        <Plus className="h-3.5 w-3.5" /> Add Student
                      </button>
                    </div>
                    {students.map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="flex-1">
                          <UserAutocomplete
                            role="Student"
                            value={s.id}
                            onChange={(val) => updateStudent(i, val)}
                            placeholder="Search Student..."
                            label=""
                          />
                        </div>
                        {students.length > 1 && (
                          <button type="button" onClick={() => removeStudent(i)} className="text-slate-400 hover:text-red-600 mt-1 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Registration Form Builder */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
                      <HelpCircle className="h-4 w-4 text-blue-500" />
                      <span>Custom Registration Questions Builder</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Build dynamic fields such as short text, dropdown lists, checkboxes, dates, or file uploads.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addCustomQuestion(false)}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border border-blue-200/40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                {customQuestions.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    {customQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 relative animate-fadeIn"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveQuestion(idx, 'up', false)}
                              className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === customQuestions.length - 1}
                              onClick={() => moveQuestion(idx, 'down', false)}
                              className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateQuestion(idx, false)}
                              className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-[10px]"
                              title="Duplicate Question"
                            >
                              <Copy className="h-3.5 w-3.5" /> Duplicate
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCustomQuestion(idx, false)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-6">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                              Question Label / Text <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={q.questionText}
                              onChange={(e) => updateQuestionText(idx, e.target.value, false)}
                              placeholder="e.g. Enter your GitHub profile url"
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                              Question Type
                            </label>
                            <select
                              value={q.questionType}
                              onChange={(e) => updateQuestionType(idx, e.target.value, false)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-bold text-slate-900 dark:text-white"
                            >
                              <option value="text">Short Text</option>
                              <option value="paragraph">Paragraph Text</option>
                              <option value="number">Number Input</option>
                              <option value="email">Email Address</option>
                              <option value="phone">Phone / Contact</option>
                              <option value="dropdown">Dropdown List</option>
                              <option value="checkbox">Checkboxes (Multi-select)</option>
                              <option value="radio">Radio Options (Single-select)</option>
                              <option value="date">Date Picker</option>
                              <option value="time">Time Picker</option>
                              <option value="file">File Upload Attachment</option>
                            </select>
                          </div>

                          <div className="md:col-span-2 flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400">
                              <input
                                type="checkbox"
                                checked={q.required}
                                onChange={() => toggleQuestionRequired(idx, false)}
                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                              />
                              <span>Required?</span>
                            </label>
                          </div>
                        </div>

                        {['dropdown', 'checkbox', 'radio'].includes(q.questionType) && (
                          <div className="p-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold uppercase text-slate-400">Choices</span>
                              <button type="button" onClick={() => addQuestionOption(idx, false)} className="text-[11px] font-bold text-blue-600 flex items-center gap-0.5">
                                <Plus className="h-3 w-3" /> Add Choice
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    required
                                    value={opt}
                                    onChange={(e) => updateQuestionOption(idx, optIdx, e.target.value, false)}
                                    placeholder={`Choice #${optIdx + 1}`}
                                    className="flex-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1.5 text-xs text-slate-900 dark:text-white"
                                  />
                                  {q.options.length > 1 && (
                                    <button type="button" onClick={() => removeQuestionOption(idx, optIdx, false)} className="text-slate-400 hover:text-red-500">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    No custom questions configured. Individual details (name, email, department, contact number) are collected by default.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION B: Event Group Form */}
        {
          eventType === 'Multiple' && (
            <div className="space-y-6">
              {/* Event Group Parent Details */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 font-heading">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span>Event Group Parent Details</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Event Group Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={festName}
                      onChange={(e) => setFestName(e.target.value)}
                      placeholder="e.g. InnovateX 2026 / Tech Event Series"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Theme / Tagline
                    </label>
                    <input
                      type="text"
                      value={festTheme}
                      onChange={(e) => setFestTheme(e.target.value)}
                      placeholder="e.g. Elevate. Innovate. Inspire"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Event Group Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows="4"
                    value={festDescription}
                    onChange={(e) => setFestDescription(e.target.value)}
                    placeholder="Describe the overall context, eligibility, and rules of the Event Group tracks..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Event Group Banner Image {!editFestivalId && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required={!editFestivalId}
                      onChange={(e) => setFestBanner(e.target.files[0])}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Campus / Primary Venue <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={festVenue}
                      onChange={(e) => setFestVenue(e.target.value)}
                      placeholder="e.g. Engineering Block Campus Quad"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Event Group Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={festStartDate}
                      onChange={(e) => setFestStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold text-slate-955 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Event Group End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={festEndDate}
                      onChange={(e) => setFestEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold text-slate-955 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Registration Rule for Multiple Sub-events */}
                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={allowMultipleRegistrations}
                      onChange={(e) => setAllowMultipleRegistrations(e.target.checked)}
                      className="h-4.5 w-4.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-800"
                    />
                    <span>Allow students to register for more than one sub-event in this Event Group</span>
                  </label>
                </div>
              </div>

              {/* Sub-Events List Configurator */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
                    <Layers className="h-4 w-4 text-purple-500" />
                    <span>Sub-Events Configurator ({subEvents.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddSubEvent}
                    className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-purple-200/40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Sub-Event</span>
                  </button>
                </div>

                {subEvents.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                    No sub-events added yet. A Event Group must contain at least one sub-event activity.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {subEvents.map((sub, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                              {sub.title || 'Untitled Sub-Event'}
                            </h4>
                            <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">
                              {sub.type} Event
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateSubEvent(idx)}
                              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                              title="Duplicate sub-event"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubEvent(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                              title="Delete sub-event"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 grid grid-cols-2 gap-2">
                          <div>
                            <strong>Venue:</strong> {sub.venue || 'Not Set'}
                          </div>
                          <div>
                            <strong>Date:</strong> {sub.date ? new Date(sub.date).toLocaleDateString() : 'Not Set'}
                          </div>
                          <div>
                            <strong>Mode:</strong> {sub.registrationMode}
                          </div>
                          <div>
                            <strong>Questions:</strong> {sub.customQuestions?.length || 0} Custom
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditingSubEventIdx(idx)}
                          className="w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          <span>Configure Sub-Event Parameters</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        }

        {/* Global Submit Actions Footer */}
        <div className="flex items-center justify-end gap-3 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            type="button"
            onClick={() => navigate('/faculty/manage-events')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? 'Publishing...' : editEventId || editFestivalId ? 'Save Changes' : 'Publish Activity'}
          </button>
        </div>
      </form >

      {/* Sub-Event Editing Detail Modal Overlay (For Multiple Event type) */}
      {
        editingSubEventIdx !== null && subEvents[editingSubEventIdx] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                    Configure Sub-Event Details
                  </h3>
                  <p className="text-xs text-slate-500">Configure parameters for sub-event #{editingSubEventIdx + 1}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSubEventIdx(null)}
                  className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Form inside modal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Sub-Event Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subEvents[editingSubEventIdx].title}
                      onChange={(e) => {
                        const next = [...subEvents];
                        next[editingSubEventIdx].title = e.target.value;
                        setSubEvents(next);
                      }}
                      placeholder="e.g. Coding Competition / Hackathon"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Event Category
                    </label>
                    <select
                      value={subEvents[editingSubEventIdx].type}
                      onChange={(e) => {
                        const next = [...subEvents];
                        next[editingSubEventIdx].type = e.target.value;
                        setSubEvents(next);
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Non-Technical">Non-Technical</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Webinar">Webinar</option>
                      <option value="Sports">Sports</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={subEvents[editingSubEventIdx].description}
                    onChange={(e) => {
                      const next = [...subEvents];
                      next[editingSubEventIdx].description = e.target.value;
                      setSubEvents(next);
                    }}
                    placeholder="Sub-event description, rules, eligibility..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Specific Sub-Event Venue
                    </label>
                    <input
                      type="text"
                      value={subEvents[editingSubEventIdx].venue}
                      onChange={(e) => {
                        const next = [...subEvents];
                        next[editingSubEventIdx].venue = e.target.value;
                        setSubEvents(next);
                      }}
                      placeholder="e.g. Seminar Hall 3"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Organized By <span className="text-red-500">*</span>
                    </label>
                    <div
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white flex items-center justify-between cursor-pointer"
                      onClick={() => setIsSubOrganizerDropdownOpen(!isSubOrganizerDropdownOpen)}
                    >
                      <span>{subEvents[editingSubEventIdx].organizedBy || 'Select Organization'}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isSubOrganizerDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isSubOrganizerDropdownOpen && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <Search className="h-4 w-4 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={subOrganizerSearch}
                            onChange={(e) => setSubOrganizerSearch(e.target.value)}
                            placeholder="Search organizers..."
                            className="w-full bg-transparent text-xs outline-none text-slate-900 dark:text-white"
                            autoFocus
                          />
                        </div>
                        <ul className="max-h-60 overflow-y-auto">
                          {ORGANIZERS_LIST.filter(org => org.toLowerCase().includes(subOrganizerSearch.toLowerCase())).map(org => (
                            <li
                              key={org}
                              onClick={() => {
                                const next = [...subEvents];
                                next[editingSubEventIdx].organizedBy = org;
                                setSubEvents(next);
                                setIsSubOrganizerDropdownOpen(false);
                                setSubOrganizerSearch('');
                              }}
                              className={`p-3 text-xs cursor-pointer flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 ${subEvents[editingSubEventIdx].organizedBy === org ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600' : 'text-slate-700 dark:text-slate-300'}`}
                            >
                              <span>{org}</span>
                              {subEvents[editingSubEventIdx].organizedBy === org && <Check className="h-3 w-3" />}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {subEvents[editingSubEventIdx].organizedBy === 'Other (Custom)' && (
                  <div className="animate-fadeIn">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Enter Organization / Club Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subEvents[editingSubEventIdx].customOrganizedBy}
                      onChange={(e) => {
                        const next = [...subEvents];
                        next[editingSubEventIdx].customOrganizedBy = e.target.value;
                        setSubEvents(next);
                      }}
                      placeholder="e.g. Science Club"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-4">
                    Eligible Departments <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${(subEvents[editingSubEventIdx].eligibleDepartments || []).includes('All Departments') ? 'border-purple-600 bg-purple-50/20 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}>
                      <input
                        type="checkbox"
                        checked={(subEvents[editingSubEventIdx].eligibleDepartments || []).includes('All Departments')}
                        onChange={() => toggleSubDepartment('All Departments')}
                        className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">All Departments</span>
                    </label>

                    {DEPARTMENTS_LIST.map(dept => {
                      const isChecked = (subEvents[editingSubEventIdx].eligibleDepartments || []).includes(dept);
                      const isDisabled = (subEvents[editingSubEventIdx].eligibleDepartments || []).includes('All Departments');
                      return (
                        <label key={dept} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${isChecked ? 'border-purple-600 bg-purple-50/20 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-800'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300'}`}>
                          <input
                            type="checkbox"
                            disabled={isDisabled}
                            checked={isChecked}
                            onChange={() => toggleSubDepartment(dept)}
                            className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{dept}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Activity Date
                    </label>
                    <input
                      type="date"
                      value={subEvents[editingSubEventIdx].date ? subEvents[editingSubEventIdx].date.split('T')[0] : ''}
                      onChange={(e) => {
                        const next = [...subEvents];
                        next[editingSubEventIdx].date = e.target.value;
                        setSubEvents(next);
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={subEvents[editingSubEventIdx].startTime}
                      onChange={(e) => {
                        const next = [...subEvents];
                        next[editingSubEventIdx].startTime = e.target.value;
                        setSubEvents(next);
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-955 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={subEvents[editingSubEventIdx].endTime}
                      onChange={(e) => {
                        const next = [...subEvents];
                        next[editingSubEventIdx].endTime = e.target.value;
                        setSubEvents(next);
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-955 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Reg. Deadline
                    </label>
                    <input
                      type="date"
                      value={subEvents[editingSubEventIdx].lastRegistrationDate ? subEvents[editingSubEventIdx].lastRegistrationDate.split('T')[0] : ''}
                      onChange={(e) => {
                        const next = [...subEvents];
                        next[editingSubEventIdx].lastRegistrationDate = e.target.value;
                        setSubEvents(next);
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 p-2.5 text-xs text-slate-955 dark:text-white"
                    />
                  </div>
                </div>

                {/* Registration Mode / Limits Config */}
                <div className="p-4 bg-slate-50 dark:bg-slate-955 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-955 dark:text-white uppercase tracking-wider">Registration settings</span>
                    <div className="flex gap-2">
                      {['Individual', 'Team', 'Both'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            const next = [...subEvents];
                            next[editingSubEventIdx].registrationMode = mode;
                            setSubEvents(next);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${subEvents[editingSubEventIdx].registrationMode === mode
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
                            }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(subEvents[editingSubEventIdx].registrationMode === 'Individual' || subEvents[editingSubEventIdx].registrationMode === 'Both') && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500">Max Solo capacity</label>
                        <input
                          type="number"
                          value={subEvents[editingSubEventIdx].capacity || ''}
                          onChange={(e) => {
                            const next = [...subEvents];
                            next[editingSubEventIdx].capacity = e.target.value;
                            setSubEvents(next);
                          }}
                          placeholder="Unlimited if blank"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    {(subEvents[editingSubEventIdx].registrationMode === 'Team' || subEvents[editingSubEventIdx].registrationMode === 'Both') && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500">Min Team size</label>
                          <input
                            type="number"
                            value={subEvents[editingSubEventIdx].registrationConfig?.minTeamMembers || 2}
                            onChange={(e) => {
                              const next = [...subEvents];
                              next[editingSubEventIdx].registrationConfig.minTeamMembers = parseInt(e.target.value) || 2;
                              setSubEvents(next);
                            }}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500">Max Team size</label>
                          <input
                            type="number"
                            value={subEvents[editingSubEventIdx].registrationConfig?.maxTeamMembers || 5}
                            onChange={(e) => {
                              const next = [...subEvents];
                              next[editingSubEventIdx].registrationConfig.maxTeamMembers = parseInt(e.target.value) || 5;
                              setSubEvents(next);
                            }}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Modal Coordinators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Sub-Event Faculty Coordinators</span>
                      <button type="button" onClick={addSubFaculty} className="text-xs font-bold text-purple-600 flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                    {subEvents[editingSubEventIdx].coordinators?.faculty?.map((f, fIdx) => (
                      <div key={fIdx} className="flex gap-2 items-center mb-1">
                        <div className="flex-1">
                          <UserAutocomplete
                            role="Faculty"
                            value={f.id}
                            onChange={(val) => updateSubFaculty(fIdx, val)}
                            placeholder="Search Faculty..."
                            label=""
                          />
                        </div>
                        {subEvents[editingSubEventIdx].coordinators.faculty.length > 1 && (
                          <button type="button" onClick={() => removeSubFaculty(fIdx)} className="text-slate-400 hover:text-red-500 mt-1 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Sub-Event Student Coordinators</span>
                      <button type="button" onClick={addSubStudent} className="text-xs font-bold text-purple-600 flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                    {subEvents[editingSubEventIdx].coordinators?.student?.map((s, sIdx) => (
                      <div key={sIdx} className="flex gap-2 items-center mb-1">
                        <div className="flex-1">
                          <UserAutocomplete
                            role="Student"
                            value={s.id}
                            onChange={(val) => updateSubStudent(sIdx, val)}
                            placeholder="Search Student..."
                            label=""
                          />
                        </div>
                        {subEvents[editingSubEventIdx].coordinators.student.length > 1 && (
                          <button type="button" onClick={() => removeSubStudent(sIdx)} className="text-slate-400 hover:text-red-500 mt-1 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-Event Dynamic Registration Question builder */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Sub-Event Custom Registration Questions</span>
                    <button
                      type="button"
                      onClick={() => addCustomQuestion(true)}
                      className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Question
                    </button>
                  </div>

                  {subEvents[editingSubEventIdx].customQuestions?.length > 0 ? (
                    <div className="space-y-3">
                      {subEvents[editingSubEventIdx].customQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500">Question #{qIdx + 1}</span>
                              <button
                                type="button"
                                disabled={qIdx === 0}
                                onClick={() => moveQuestion(qIdx, 'up', true)}
                                className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={qIdx === subEvents[editingSubEventIdx].customQuestions.length - 1}
                                onClick={() => moveQuestion(qIdx, 'down', true)}
                                className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicateQuestion(qIdx, true)}
                                className="p-0.5 text-slate-400 hover:text-slate-700 text-[9px] flex items-center gap-0.5"
                              >
                                <Copy className="h-3 w-3" /> Duplicate
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCustomQuestion(qIdx, true)}
                              className="text-slate-400 hover:text-red-500 p-0.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-6">
                              <input
                                type="text"
                                required
                                value={q.questionText}
                                onChange={(e) => updateQuestionText(qIdx, e.target.value, true)}
                                placeholder="Question Label..."
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
                              />
                            </div>

                            <div className="md:col-span-4">
                              <select
                                value={q.questionType}
                                onChange={(e) => updateQuestionType(qIdx, e.target.value, true)}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white"
                              >
                                <option value="text">Short Text</option>
                                <option value="paragraph">Paragraph Text</option>
                                <option value="number">Number Input</option>
                                <option value="email">Email Address</option>
                                <option value="phone">Phone / Contact</option>
                                <option value="dropdown">Dropdown List</option>
                                <option value="checkbox">Checkboxes (Multi-select)</option>
                                <option value="radio">Radio Options (Single-select)</option>
                                <option value="date">Date Picker</option>
                                <option value="time">Time Picker</option>
                                <option value="file">File Upload Attachment</option>
                              </select>
                            </div>

                            <div className="md:col-span-2 flex items-center pt-2">
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={q.required}
                                  onChange={() => toggleQuestionRequired(qIdx, true)}
                                  className="rounded text-blue-600 h-3.5 w-3.5"
                                />
                                <span>Required</span>
                              </label>
                            </div>
                          </div>

                          {['dropdown', 'checkbox', 'radio'].includes(q.questionType) && (
                            <div className="p-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold uppercase text-slate-400">Choices</span>
                                <button type="button" onClick={() => addQuestionOption(qIdx, true)} className="text-[11px] font-bold text-purple-600 flex items-center gap-0.5">
                                  <Plus className="h-3 w-3" /> Add Choice
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      required
                                      value={opt}
                                      onChange={(e) => updateQuestionOption(qIdx, optIdx, e.target.value, true)}
                                      placeholder={`Choice #${optIdx + 1}`}
                                      className="flex-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1.5 text-xs text-slate-900 dark:text-white"
                                    />
                                    {q.options.length > 1 && (
                                      <button type="button" onClick={() => removeQuestionOption(qIdx, optIdx, true)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 border border-dashed border-slate-200 p-4 text-center rounded-xl">
                      No custom questions configured.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingSubEventIdx(null)}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-md cursor-pointer"
                >
                  Save Details & Return
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default CreateEvent;
