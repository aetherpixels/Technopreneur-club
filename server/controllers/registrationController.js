import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Festival from '../models/Festival.js';
import { autoGenerateCertificates } from './certificateController.js';

// @desc    Register Student for an Event
// @route   POST /api/registrations
// @access  Private/Student
export const registerForEvent = async (req, res, next) => {
  try {
    const {
      eventId,
      registrationType = 'Individual',
      teamName,
      teamMembers,
      contactNumber,
      department,
      facultyMentor,
      customResponses
    } = req.body;
    const studentId = req.user._id;

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if registering for a sub-event of a festival, and check if festival allows multiple registrations
    if (event.festival) {
      const festival = await Festival.findById(event.festival);
      if (festival && festival.allowMultipleRegistrations === false) {
        // Check if student has registered for any sub-event under this festival
        const childEvents = await Event.find({ festival: event.festival });
        const childEventIds = childEvents.map(e => e._id);
        const existingFestivalReg = await Registration.findOne({
          student: studentId,
          event: { $in: childEventIds },
          status: 'Registered'
        });
        if (existingFestivalReg) {
          return res.status(400).json({
            success: false,
            message: `You have already registered for another event in "${festival.name}". Registering for multiple sub-events is not permitted.`
          });
        }
      }
    }

    // Check event status
    if (event.status !== 'Published' && event.status !== 'Registration Open') {
      return res.status(400).json({ success: false, message: 'Registrations are not open for this event' });
    }

    // Verify registration deadline
    const currentDate = new Date();
    if (new Date(event.lastRegistrationDate) < currentDate) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    // Check allowed registration mode for event
    if (event.registrationMode === 'Individual' && registrationType === 'Team') {
      return res.status(400).json({ success: false, message: 'This event only accepts Individual registrations.' });
    }
    if (event.registrationMode === 'Team' && registrationType === 'Individual') {
      return res.status(400).json({ success: false, message: 'This event only accepts Team registrations.' });
    }

    // Check duplicate registration
    const existingReg = await Registration.findOne({ event: eventId, student: studentId });
    if (existingReg && existingReg.status === 'Registered') {
      return res.status(409).json({ success: false, message: 'You are already registered for this event.' });
    }

    // Team validation if registering as team
    let parsedTeamMembers = [];
    if (registrationType === 'Team') {
      if (!teamName || !teamName.trim()) {
        return res.status(400).json({ success: false, message: 'Team Name is required for team registration.' });
      }

      parsedTeamMembers = teamMembers || [];
      if (typeof teamMembers === 'string') {
        try {
          parsedTeamMembers = JSON.parse(teamMembers);
        } catch (e) {}
      }

      // Total members includes leader + extra members
      const totalMembersCount = parsedTeamMembers.length + 1; // +1 for team leader
      const minSize = event.registrationConfig?.minTeamMembers || 2;
      const maxSize = event.registrationConfig?.maxTeamMembers || 5;

      if (totalMembersCount < minSize) {
        return res.status(400).json({
          success: false,
          message: `Team requires a minimum of ${minSize} members. You provided ${totalMembersCount}.`
        });
      }
      if (totalMembersCount > maxSize) {
        return res.status(400).json({
          success: false,
          message: `Team allows a maximum of ${maxSize} members. You provided ${totalMembersCount}.`
        });
      }
    }

    // Capacity checks
    if (event.capacity) {
      const activeRegsCount = await Registration.countDocuments({ event: eventId, status: 'Registered' });
      if (activeRegsCount >= event.capacity) {
        return res.status(400).json({ success: false, message: 'Event capacity reached. Registration closed.' });
      }
    }

    // Parse and validate custom responses
    let parsedResponses = customResponses || [];
    if (typeof customResponses === 'string') {
      try {
        parsedResponses = JSON.parse(customResponses);
      } catch (err) {}
    }

    const sanitizedResponses = [];
    if (event.customQuestions && event.customQuestions.length > 0) {
      for (const q of event.customQuestions) {
        // Find answer by questionId or questionText
        const resp = parsedResponses.find(r => 
          (r.questionId && r.questionId.toString() === q._id.toString()) || 
          (r.questionText && r.questionText.trim() === q.questionText.trim())
        );

        let hasAnswer = false;
        let finalAnswer = null;

        if (resp && resp.answer !== undefined && resp.answer !== null && resp.answer !== '') {
          finalAnswer = resp.answer;
          hasAnswer = Array.isArray(finalAnswer) ? finalAnswer.length > 0 : String(finalAnswer).trim() !== '';
        }

        if (q.required && !hasAnswer) {
          return res.status(400).json({ success: false, message: `Question "${q.questionText}" is required.` });
        }

        if (hasAnswer) {
          sanitizedResponses.push({
            questionId: q._id,
            questionText: q.questionText,
            questionType: q.questionType,
            answer: finalAnswer
          });
        }
      }
    }

    let parsedMentor = facultyMentor;
    if (typeof facultyMentor === 'string') {
      try {
        parsedMentor = JSON.parse(facultyMentor);
      } catch (e) {}
    }

    let registration;
    if (existingReg) {
      existingReg.status = 'Registered';
      existingReg.registrationType = registrationType;
      existingReg.teamName = registrationType === 'Team' ? teamName : null;
      existingReg.teamLeader = registrationType === 'Team' ? studentId : null;
      existingReg.teamMembers = registrationType === 'Team' ? parsedTeamMembers : [];
      existingReg.contactNumber = contactNumber || req.user.contactNumber;
      existingReg.department = department || req.user.department;
      existingReg.facultyMentor = parsedMentor || null;
      existingReg.registrationDate = new Date();
      existingReg.customResponses = sanitizedResponses;
      registration = await existingReg.save();
    } else {
      registration = await Registration.create({
        event: eventId,
        student: studentId,
        registrationType,
        teamName: registrationType === 'Team' ? teamName : null,
        teamLeader: registrationType === 'Team' ? studentId : null,
        teamMembers: registrationType === 'Team' ? parsedTeamMembers : [],
        contactNumber: contactNumber || req.user.contactNumber,
        department: department || req.user.department,
        facultyMentor: parsedMentor || null,
        status: 'Registered',
        attendanceStatus: 'Pending',
        certificateStatus: 'Not Available',
        customResponses: sanitizedResponses
      });
    }

    res.status(201).json({
      success: true,
      message: registrationType === 'Team' ? `Team "${teamName}" registered successfully!` : 'Individual registration successful!',
      registration
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel Student Registration
// @route   POST /api/registrations/:id/cancel
// @access  Private/Student
export const cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found' });
    }

    if (registration.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this registration' });
    }

    registration.status = 'Cancelled';
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Student Registrations List
// @route   GET /api/registrations/my-registrations
// @access  Private/Student
export const getRegisteredEvents = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ student: req.user._id, status: 'Registered' })
      .populate({
        path: 'event',
        select: 'title type venue date startTime endTime status poster'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      registrations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Registrations for a Specific Event (Faculty only)
// @route   GET /api/registrations/event/:eventId
// @access  Private/Faculty
export const getEventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Access check
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view these registrations' });
    }

    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('student', 'name email department contactNumber enrollmentNumber')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      registrations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark Attendance & Handle Manual Student Entry (Faculty only)
// @route   POST /api/registrations/attendance/:eventId
// @access  Private/Faculty
export const markAttendance = async (req, res, next) => {
  try {
    const { attendance, manualStudents } = req.body;
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Authorization
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update attendance for this event' });
    }

    // Process attendance updates
    if (attendance && Array.isArray(attendance)) {
      await Promise.all(attendance.map(async (record) => {
        const { studentId, status } = record; // status: 'Present' or 'Absent'
        
        // If registering dynamically from offline search, check if registration exists
        let reg = await Registration.findOne({ event: eventId, student: studentId });
        if (!reg) {
          reg = await Registration.create({
            event: eventId,
            student: studentId,
            status: 'Registered',
            attendanceStatus: status,
            certificateStatus: status === 'Present' ? 'Available' : 'Not Available'
          });
        } else {
          await Registration.findOneAndUpdate(
            { event: eventId, student: studentId },
            { 
              attendanceStatus: status, 
              certificateStatus: status === 'Present' ? 'Available' : 'Not Available' 
            }
          );
        }
      }));
    }

    // Auto-generate certificates asynchronously
    Registration.find({ event: eventId, attendanceStatus: 'Present' })
      .select('student')
      .then(regs => {
        const allPresentIds = regs.map(r => r.student.toString());
        autoGenerateCertificates(eventId, allPresentIds);
      })
      .catch(err => console.error("Failed to query present students for auto-gen", err));

    res.status(200).json({
      success: true,
      message: 'Attendance recorded and certificate permissions updated.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Registrations to Excel/CSV (Faculty/Admin only)
// @route   GET /api/registrations/event/:eventId/export
// @access  Private/Faculty
import ExcelJS from 'exceljs';

export const exportRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to export these registrations' });
    }

    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('student', 'name email department contactNumber enrollmentNumber')
      .sort({ createdAt: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');

    // Define basic static columns
    const columns = [
      { header: 'Enrollment Number', key: 'enrollmentNumber', width: 20 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Contact Number', key: 'contactNumber', width: 15 },
      { header: 'Department', key: 'department', width: 35 },
      { header: 'Semester', key: 'semester', width: 10 },
      { header: 'Division', key: 'division', width: 10 },
      { header: 'Registration Date', key: 'registrationDate', width: 20 },
      { header: 'Registration Status', key: 'registrationStatus', width: 20 },
      { header: 'Attendance Status', key: 'attendanceStatus', width: 20 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Team Name', key: 'teamName', width: 20 }
    ];

    // Add dynamic columns based strictly on event's customQuestions configuration
    if (event.customQuestions && event.customQuestions.length > 0) {
      event.customQuestions.forEach(q => {
        // Use the question ID as the key to avoid issues with special characters in keys, but header is the actual text
        columns.push({
          header: q.questionText,
          key: `custom_${q._id}`,
          width: 30
        });
      });
    }

    worksheet.columns = columns;

    const data = registrations.map(reg => {
      const isTeam = reg.registrationType === 'Team';
      const rowData = {
        enrollmentNumber: reg.student?.enrollmentNumber || 'N/A',
        studentName: reg.student?.name || 'N/A',
        email: reg.student?.email || 'N/A',
        contactNumber: reg.contactNumber || reg.student?.contactNumber || 'N/A',
        department: reg.student?.department || reg.department || 'N/A',
        semester: reg.student?.semester || 'N/A',
        division: reg.student?.division || 'N/A',
        registrationDate: new Date(reg.registrationDate).toLocaleString(),
        registrationStatus: reg.status,
        attendanceStatus: reg.attendanceStatus,
        type: reg.registrationType,
        teamName: isTeam ? reg.teamName : 'N/A'
      };

      // Map custom responses exactly to configured dynamic columns
      if (event.customQuestions && event.customQuestions.length > 0) {
        event.customQuestions.forEach(q => {
          // Find the student's answer using questionId (first choice) or questionText
          const resp = reg.customResponses?.find(cr => 
            (cr.questionId && cr.questionId.toString() === q._id.toString()) || 
            (cr.questionText === q.questionText)
          );
          
          let formattedAnswer = 'N/A';
          if (resp && resp.answer !== undefined && resp.answer !== null && resp.answer !== '') {
            if (q.questionType === 'file') {
              // Construct absolute URL for Excel
              const protocol = req.protocol;
              const host = req.get('host');
              formattedAnswer = Array.isArray(resp.answer) 
                ? resp.answer.map(a => `${protocol}://${host}${a}`).join(', ')
                : `${protocol}://${host}${resp.answer}`;
            } else {
              formattedAnswer = Array.isArray(resp.answer) ? resp.answer.join(', ') : String(resp.answer);
            }
          }
          rowData[`custom_${q._id}`] = formattedAnswer;
        });
      }

      return rowData;
    });

    data.forEach(row => {
      worksheet.addRow(row);
    });

    // Sanitize filename
    const sanitizedTitle = event.title.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_');
    
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`EventHub_${sanitizedTitle}_Registrations.xlsx`);
    return workbook.xlsx.write(res).then(() => {
      res.status(200).end();
    });
  } catch (error) {
    next(error);
  }
};
