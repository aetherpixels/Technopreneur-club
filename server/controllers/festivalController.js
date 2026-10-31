import Festival from '../models/Festival.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import fs from 'fs';
import path from 'path';

// @desc    Create a new Festival
// @route   POST /api/festivals
// @access  Private (Faculty/Admin)
export const createFestival = async (req, res, next) => {
  try {
    const {
      name,
      theme,
      description,
      venue,
      startDate,
      endDate,
      overallFacultyCoordinator,
      participatingDepartments,
      status,
      allowMultipleRegistrations
    } = req.body;

    let bannerUrl = '/uploads/default_poster.png';
    if (req.file) {
      bannerUrl = `/uploads/${req.file.filename}`;
    }

    let parsedCoordinator = overallFacultyCoordinator;
    if (typeof overallFacultyCoordinator === 'string') {
      try {
        parsedCoordinator = JSON.parse(overallFacultyCoordinator);
      } catch (e) {
        parsedCoordinator = { name: overallFacultyCoordinator };
      }
    }

    let parsedDepts = participatingDepartments;
    if (typeof participatingDepartments === 'string') {
      try {
        parsedDepts = JSON.parse(participatingDepartments);
      } catch (e) {
        parsedDepts = participatingDepartments.split(',').map(d => d.trim());
      }
    }

    const festival = await Festival.create({
      name,
      theme,
      description,
      banner: bannerUrl,
      venue,
      startDate,
      endDate,
      overallFacultyCoordinator: parsedCoordinator || { name: req.user.name },
      participatingDepartments: parsedDepts || ['ALL'],
      status: status || 'Published',
      allowMultipleRegistrations: allowMultipleRegistrations !== 'false' && allowMultipleRegistrations !== false,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Festival created successfully',
      festival
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Get All Festivals with analytics stats
// @route   GET /api/festivals
// @access  Public
export const getFestivals = async (req, res, next) => {
  try {
    const festivals = await Festival.find()
      .populate('createdBy', 'name email department')
      .sort({ startDate: -1 });

    const festivalListWithStats = await Promise.all(
      festivals.map(async (fest) => {
        const childEvents = await Event.find({ festival: fest._id });
        const childEventIds = childEvents.map(e => e._id);
        const registrations = await Registration.find({ event: { $in: childEventIds } });
        const teamRegistrations = registrations.filter(r => r.registrationType === 'Team');

        return {
          ...fest.toObject(),
          totalEvents: childEvents.length,
          activeEvents: childEvents.filter(e => e.status === 'Published' || e.status === 'Registration Open').length,
          completedEvents: childEvents.filter(e => e.status === 'Completed').length,
          upcomingEvents: childEvents.filter(e => new Date(e.date) > new Date()).length,
          totalRegistrations: registrations.length,
          totalTeams: teamRegistrations.length,
          childEvents
        };
      })
    );

    res.status(200).json({
      success: true,
      festivals: festivalListWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Festival By ID with child events and dashboard analytics
// @route   GET /api/festivals/:id
// @access  Public
export const getFestivalById = async (req, res, next) => {
  try {
    const festival = await Festival.findById(req.params.id)
      .populate('createdBy', 'name email department');

    if (!festival) {
      return res.status(404).json({ success: false, message: 'Festival not found' });
    }

    const childEvents = await Event.find({ festival: festival._id })
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    const childEventIds = childEvents.map(e => e._id);
    const registrations = await Registration.find({ event: { $in: childEventIds } });
    const teamRegistrations = registrations.filter(r => r.registrationType === 'Team');

    // Collect participating departments from events
    const deptSet = new Set(festival.participatingDepartments || []);
    childEvents.forEach(e => {
      if (e.department && e.department !== 'ALL') {
        deptSet.add(e.department);
      }
    });

    const stats = {
      totalEvents: childEvents.length,
      activeEvents: childEvents.filter(e => e.status === 'Published' || e.status === 'Registration Open').length,
      completedEvents: childEvents.filter(e => e.status === 'Completed').length,
      upcomingEvents: childEvents.filter(e => new Date(e.date) > new Date()).length,
      totalRegistrations: registrations.length,
      totalTeams: teamRegistrations.length,
      participatingDepartmentsCount: deptSet.size || 1,
      participatingDepartments: Array.from(deptSet)
    };

    res.status(200).json({
      success: true,
      festival: {
        ...festival.toObject(),
        stats,
        childEvents
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Festival
// @route   PUT /api/festivals/:id
// @access  Private (Faculty/Admin)
export const updateFestival = async (req, res, next) => {
  try {
    let festival = await Festival.findById(req.params.id);
    if (!festival) {
      return res.status(404).json({ success: false, message: 'Festival not found' });
    }

    const updateData = { ...req.body };
    if (req.file) {
      updateData.banner = `/uploads/${req.file.filename}`;
      // Clean up previous banner if custom
      if (festival.banner && festival.banner !== '/uploads/default_poster.png') {
        const oldPath = path.join('.', festival.banner);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    if (typeof updateData.overallFacultyCoordinator === 'string') {
      try {
        updateData.overallFacultyCoordinator = JSON.parse(updateData.overallFacultyCoordinator);
      } catch (e) {}
    }

    if (typeof updateData.participatingDepartments === 'string') {
      try {
        updateData.participatingDepartments = JSON.parse(updateData.participatingDepartments);
      } catch (e) {}
    }

    if (updateData.allowMultipleRegistrations !== undefined) {
      updateData.allowMultipleRegistrations = updateData.allowMultipleRegistrations !== 'false' && updateData.allowMultipleRegistrations !== false;
    }

    festival = await Festival.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Festival updated successfully',
      festival
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Festival
// @route   DELETE /api/festivals/:id
// @access  Private (Faculty/Admin)
export const deleteFestival = async (req, res, next) => {
  try {
    const festival = await Festival.findById(req.params.id);
    if (!festival) {
      return res.status(404).json({ success: false, message: 'Festival not found' });
    }

    // Delete associated banner file if exists
    if (festival.banner && festival.banner !== '/uploads/default_poster.png') {
      const bannerPath = path.join('.', festival.banner);
      if (fs.existsSync(bannerPath)) fs.unlinkSync(bannerPath);
    }

    // Remove festival ref from child events (or keep events standalone)
    await Event.updateMany({ festival: festival._id }, { festival: null });

    await Festival.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Festival deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Festival Status (e.g. Mark Completed)
// @route   PATCH /api/festivals/:id/status
// @access  Private (Faculty/Admin)
export const updateFestivalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    let festival = await Festival.findById(req.params.id);

    if (!festival) {
      return res.status(404).json({ success: false, message: 'Festival not found' });
    }

    festival.status = status || festival.status;
    await festival.save();

    // If marked Completed, also mark all child events as Completed
    if (status === 'Completed') {
      await Event.updateMany({ festival: festival._id }, { status: 'Completed', completionDate: new Date() });
    }

    res.status(200).json({
      success: true,
      message: `Festival status updated to ${festival.status}`,
      festival
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new unified Festival with nested Sub-Events
// @route   POST /api/festivals/unified
// @access  Private (Faculty/Admin)
export const createFestivalUnified = async (req, res, next) => {
  try {
    const {
      name,
      theme,
      description,
      venue,
      startDate,
      endDate,
      overallFacultyCoordinator,
      participatingDepartments,
      allowMultipleRegistrations,
      subEvents
    } = req.body;

    let bannerUrl = '/uploads/default_poster.png';
    if (req.file) {
      bannerUrl = `/uploads/${req.file.filename}`;
    }

    let parsedCoordinator = overallFacultyCoordinator;
    if (typeof overallFacultyCoordinator === 'string') {
      try {
        parsedCoordinator = JSON.parse(overallFacultyCoordinator);
      } catch (e) {
        parsedCoordinator = { name: overallFacultyCoordinator };
      }
    }

    let parsedDepts = participatingDepartments;
    if (typeof participatingDepartments === 'string') {
      try {
        parsedDepts = JSON.parse(participatingDepartments);
      } catch (e) {
        parsedDepts = participatingDepartments.split(',').map(d => d.trim());
      }
    }

    const festival = await Festival.create({
      name,
      theme,
      description,
      banner: bannerUrl,
      venue,
      startDate,
      endDate,
      overallFacultyCoordinator: parsedCoordinator || { name: req.user.name },
      participatingDepartments: parsedDepts || ['ALL'],
      status: 'Published',
      allowMultipleRegistrations: allowMultipleRegistrations !== 'false' && allowMultipleRegistrations !== false,
      createdBy: req.user._id
    });

    let parsedSubEvents = [];
    if (subEvents) {
      if (typeof subEvents === 'string') {
        try {
          parsedSubEvents = JSON.parse(subEvents);
        } catch (e) {
          console.error('Failed to parse subEvents:', e);
        }
      } else if (Array.isArray(subEvents)) {
        parsedSubEvents = subEvents;
      }
    }

    // Create child events
    for (const sub of parsedSubEvents) {
      const eventDateObj = new Date(sub.date || startDate);
      const lastRegDateObj = new Date(sub.lastRegistrationDate || sub.date || startDate);

      await Event.create({
        title: sub.title,
        poster: bannerUrl,
        description: sub.description || description,
        type: sub.type || 'Technical',
        customType: sub.customType || null,
        eligibleDepartments: sub.eligibleDepartments || ['All Departments'],
        organizedBy: sub.organizedBy || 'Not Specified',
        venue: sub.venue || venue,
        date: eventDateObj,
        startTime: sub.startTime || '09:00',
        endTime: sub.endTime || '17:00',
        lastRegistrationDate: lastRegDateObj,
        capacity: sub.capacity ? parseInt(sub.capacity) : null,
        coordinators: sub.coordinators || { faculty: [], student: [] },
        festival: festival._id,
        registrationMode: sub.registrationMode || 'Individual',
        registrationConfig: sub.registrationConfig || {
          maxIndividualParticipants: sub.capacity ? parseInt(sub.capacity) : null,
          minTeamMembers: 2,
          maxTeamMembers: 5,
          requireTeamLeader: true,
          allowFacultyMentor: false
        },
        customQuestions: sub.customQuestions || [],
        createdBy: req.user._id,
        status: 'Published'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Multi-Event Festival and sub-events created successfully',
      festival
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Update a unified Festival with nested Sub-Events
// @route   PUT /api/festivals/unified/:id
// @access  Private (Faculty/Admin)
export const updateFestivalUnified = async (req, res, next) => {
  try {
    let festival = await Festival.findById(req.params.id);
    if (!festival) {
      return res.status(404).json({ success: false, message: 'Festival not found' });
    }

    const {
      name,
      theme,
      description,
      venue,
      startDate,
      endDate,
      overallFacultyCoordinator,
      participatingDepartments,
      allowMultipleRegistrations,
      subEvents
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (theme) updateData.theme = theme;
    if (description) updateData.description = description;
    if (venue) updateData.venue = venue;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;

    if (req.file) {
      updateData.banner = `/uploads/${req.file.filename}`;
      if (festival.banner && festival.banner !== '/uploads/default_poster.png') {
        const oldPath = path.join('.', festival.banner);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const bannerUrl = updateData.banner || festival.banner;

    if (overallFacultyCoordinator) {
      if (typeof overallFacultyCoordinator === 'string') {
        try {
          updateData.overallFacultyCoordinator = JSON.parse(overallFacultyCoordinator);
        } catch (e) {
          updateData.overallFacultyCoordinator = { name: overallFacultyCoordinator };
        }
      } else {
        updateData.overallFacultyCoordinator = overallFacultyCoordinator;
      }
    }

    if (participatingDepartments) {
      if (typeof participatingDepartments === 'string') {
        try {
          updateData.participatingDepartments = JSON.parse(participatingDepartments);
        } catch (e) {
          updateData.participatingDepartments = participatingDepartments.split(',').map(d => d.trim());
        }
      } else {
        updateData.participatingDepartments = participatingDepartments;
      }
    }

    if (allowMultipleRegistrations !== undefined) {
      updateData.allowMultipleRegistrations = allowMultipleRegistrations !== 'false' && allowMultipleRegistrations !== false;
    }

    festival = await Festival.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    let parsedSubEvents = [];
    if (subEvents) {
      if (typeof subEvents === 'string') {
        try {
          parsedSubEvents = JSON.parse(subEvents);
        } catch (e) {
          console.error(e);
        }
      } else if (Array.isArray(subEvents)) {
        parsedSubEvents = subEvents;
      }
    }

    // Get currently existing child events
    const existingSubEvents = await Event.find({ festival: festival._id });
    const existingIds = existingSubEvents.map(e => e._id.toString());
    const submittedIds = parsedSubEvents.filter(s => s._id).map(s => s._id.toString());

    // 1. Delete events that are omitted
    const toDelete = existingIds.filter(id => !submittedIds.includes(id));
    if (toDelete.length > 0) {
      await Event.deleteMany({ _id: { $in: toDelete } });
    }

    // 2. Update existing ones or create new ones
    for (const sub of parsedSubEvents) {
      const eventDateObj = new Date(sub.date || startDate || festival.startDate);
      const lastRegDateObj = new Date(sub.lastRegistrationDate || sub.date || startDate || festival.startDate);

      const subEventData = {
        title: sub.title,
        poster: bannerUrl,
        description: sub.description || description || festival.description,
        type: sub.type || 'Technical',
        customType: sub.customType || null,
        eligibleDepartments: sub.eligibleDepartments || ['All Departments'],
        organizedBy: sub.organizedBy || 'Not Specified',
        venue: sub.venue || venue || festival.venue,
        date: eventDateObj,
        startTime: sub.startTime || '09:00',
        endTime: sub.endTime || '17:00',
        lastRegistrationDate: lastRegDateObj,
        capacity: sub.capacity ? parseInt(sub.capacity) : null,
        coordinators: sub.coordinators || { faculty: [], student: [] },
        registrationMode: sub.registrationMode || 'Individual',
        registrationConfig: sub.registrationConfig || {
          maxIndividualParticipants: sub.capacity ? parseInt(sub.capacity) : null,
          minTeamMembers: 2,
          maxTeamMembers: 5,
          requireTeamLeader: true,
          allowFacultyMentor: false
        },
        customQuestions: sub.customQuestions || []
      };

      if (sub._id && existingIds.includes(sub._id.toString())) {
        await Event.findByIdAndUpdate(sub._id, subEventData);
      } else {
        await Event.create({
          ...subEventData,
          festival: festival._id,
          createdBy: req.user._id,
          status: 'Published'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Unified festival and sub-events updated successfully',
      festival
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};
