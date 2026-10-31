import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

// @desc    Create and Publish Event (Faculty only)
// @route   POST /api/events
// @access  Private/Faculty
export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      customType,
      eligibleDepartments,
      organizedBy,
      venue,
      date,
      startTime,
      endTime,
      lastRegistrationDate,
      capacity,
      coordinators, // Parsed JSON string or object
      festival,
      registrationMode,
      registrationConfig,
      customQuestions
    } = req.body;

    // Poster file handler: extract file path if uploaded, or fallback to default
    let posterPath = '/uploads/default_poster.png';
    if (req.file) {
      posterPath = `/uploads/${req.file.filename}`;
    } else if (req.body.poster) {
      posterPath = req.body.poster; // Allow raw URL string
    }

    // Parse coordinators if they are incoming as JSON string (due to multipart form-data)
    let parsedCoordinators = coordinators;
    if (typeof coordinators === 'string') {
      try {
        parsedCoordinators = JSON.parse(coordinators);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid coordinators format' });
      }
    }

    // Parse registrationConfig if string
    let parsedRegConfig = registrationConfig;
    if (typeof registrationConfig === 'string') {
      try {
        parsedRegConfig = JSON.parse(registrationConfig);
      } catch (err) {}
    }

    // Parse customQuestions if string
    let parsedQuestions = customQuestions;
    if (typeof customQuestions === 'string') {
      try {
        parsedQuestions = JSON.parse(customQuestions);
      } catch (err) {}
    }

    // Parse eligibleDepartments if string
    let parsedDepartments = eligibleDepartments;
    if (typeof eligibleDepartments === 'string') {
      try {
        parsedDepartments = JSON.parse(eligibleDepartments);
      } catch (err) {}
    }

    // Validate times
    const eventDateObj = new Date(date);
    const lastRegDateObj = new Date(lastRegistrationDate);

    if (lastRegDateObj > eventDateObj) {
      return res.status(400).json({ success: false, message: 'Last registration date cannot be after event date' });
    }

    const event = await Event.create({
      title,
      poster: posterPath,
      description,
      type,
      customType,
      eligibleDepartments: parsedDepartments || ['All Departments'],
      organizedBy,
      venue,
      date: eventDateObj,
      startTime,
      endTime,
      lastRegistrationDate: lastRegDateObj,
      capacity: capacity ? parseInt(capacity) : null,
      coordinators: parsedCoordinators || { faculty: [], student: [] },
      festival: festival || null,
      registrationMode: registrationMode || 'Individual',
      registrationConfig: parsedRegConfig || {
        maxIndividualParticipants: capacity ? parseInt(capacity) : null,
        minTeamMembers: 2,
        maxTeamMembers: 5,
        requireTeamLeader: true,
        allowFacultyMentor: false
      },
      customQuestions: parsedQuestions || [],
      createdBy: req.user._id,
      status: 'Published'
    });

    res.status(201).json({
      success: true,
      message: 'Event published successfully',
      event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit Event (Faculty only)
// @route   PUT /api/events/:id
// @access  Private/Faculty
export const editEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      customType,
      eligibleDepartments,
      organizedBy,
      venue,
      date,
      startTime,
      endTime,
      lastRegistrationDate,
      capacity,
      coordinators,
      registrationMode,
      registrationConfig,
      customQuestions
    } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Authorization
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'Not authorized to edit this event' });
    }

    // Poster handling
    let posterPath = event.poster;
    if (req.file) {
      posterPath = `/uploads/${req.file.filename}`;
      // Note: Typically you'd delete the old poster here, but we will leave it for simplicity
    } else if (req.body.poster) {
      posterPath = req.body.poster;
    }

    // Parsing JSON fields from form-data
    let parsedCoordinators = coordinators;
    if (typeof coordinators === 'string') {
      try { parsedCoordinators = JSON.parse(coordinators); } catch (err) {}
    }
    let parsedRegConfig = registrationConfig;
    if (typeof registrationConfig === 'string') {
      try { parsedRegConfig = JSON.parse(registrationConfig); } catch (err) {}
    }
    let parsedQuestions = customQuestions;
    if (typeof customQuestions === 'string') {
      try { parsedQuestions = JSON.parse(customQuestions); } catch (err) {}
    }
    let parsedDepartments = eligibleDepartments;
    if (typeof eligibleDepartments === 'string') {
      try { parsedDepartments = JSON.parse(eligibleDepartments); } catch (err) {}
    }

    // Time validation
    const eventDateObj = date ? new Date(date) : event.date;
    const lastRegDateObj = lastRegistrationDate ? new Date(lastRegistrationDate) : event.lastRegistrationDate;
    if (lastRegDateObj > eventDateObj) {
      return res.status(400).json({ success: false, message: 'Last registration date cannot be after event date' });
    }

    // Update fields
    event.title = title || event.title;
    event.poster = posterPath;
    event.description = description || event.description;
    event.type = type || event.type;
    event.customType = customType !== undefined ? customType : event.customType;
    event.eligibleDepartments = parsedDepartments || event.eligibleDepartments;
    event.organizedBy = organizedBy || event.organizedBy;
    event.venue = venue || event.venue;
    event.date = eventDateObj;
    event.startTime = startTime || event.startTime;
    event.endTime = endTime || event.endTime;
    event.lastRegistrationDate = lastRegDateObj;
    event.capacity = capacity ? parseInt(capacity) : null;
    event.coordinators = parsedCoordinators || event.coordinators;
    event.registrationMode = registrationMode || event.registrationMode;
    event.registrationConfig = parsedRegConfig || event.registrationConfig;
    event.customQuestions = parsedQuestions || event.customQuestions;

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

// @desc    Duplicate Event (Standalone or Child Event)
// @route   POST /api/events/:id/duplicate
// @access  Private/Faculty
export const duplicateEvent = async (req, res, next) => {
  try {
    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const clonedData = existingEvent.toObject();
    delete clonedData._id;
    delete clonedData.createdAt;
    delete clonedData.updatedAt;

    clonedData.title = `${clonedData.title} (Copy)`;
    clonedData.createdBy = req.user._id;
    clonedData.status = 'Draft';

    const duplicatedEvent = await Event.create(clonedData);

    res.status(201).json({
      success: true,
      message: 'Event duplicated successfully',
      event: duplicatedEvent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Event
// @route   DELETE /api/events/:id
// @access  Private/Faculty
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    await Registration.deleteMany({ event: event._id });
    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Event Status (Faculty only)
// @route   PATCH /api/events/:id/status
// @access  Private/Faculty
export const updateEventStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Draft', 'Published', 'Registration Open', 'Registration Closed', 'Ongoing', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Enforce authorization: only event creator can update
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this event' });
    }

    event.status = status;
    if (status === 'Completed') {
      event.completionDate = new Date();
      // Lock registrations
      await Registration.updateMany(
        { event: event._id, status: 'Registered', attendanceStatus: 'Pending' },
        { attendanceStatus: 'Absent' } // Default rest to absent if not marked
      );
    }
    await event.save();

    res.status(200).json({
      success: true,
      message: `Event status updated to ${status}`,
      event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get List of Events
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res, next) => {
  try {
    const { type, eligibleDepartments, status, search, limit = 20, page = 1 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (eligibleDepartments && eligibleDepartments !== 'All Departments') {
      query.$or = [{ eligibleDepartments: eligibleDepartments }, { eligibleDepartments: 'All Departments' }];
    }
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    // Attach registration count to each event
    const enrichedEvents = await Promise.all(events.map(async (event) => {
      const registrationCount = await Registration.countDocuments({ event: event._id, status: 'Registered' });
      return {
        ...event.toObject(),
        registrationCount
      };
    }));

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      events: enrichedEvents,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Event Details by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email department');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const registrationCount = await Registration.countDocuments({ event: event._id, status: 'Registered' });

    res.status(200).json({
      success: true,
      event: {
        ...event.toObject(),
        registrationCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Faculty Organized Events
// @route   GET /api/events/my-events
// @access  Private/Faculty
export const getFacultyEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ createdBy: req.user._id }).sort({ date: -1 });
    
    const enrichedEvents = await Promise.all(events.map(async (event) => {
      const registrationCount = await Registration.countDocuments({ event: event._id, status: 'Registered' });
      return {
        ...event.toObject(),
        registrationCount
      };
    }));

    res.status(200).json({
      success: true,
      events: enrichedEvents
    });
  } catch (error) {
    next(error);
  }
};
