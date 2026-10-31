import Media from '../models/Media.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Festival from '../models/Festival.js';
import path from 'path';
import fs from 'fs';

// @desc    Upload Media Files (Faculty reports/brochures/sheets or Student gallery contributions)
// @route   POST /api/media/upload
// @access  Private
export const uploadMedia = async (req, res, next) => {
  try {
    const { eventId, festivalId, category } = req.body;
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    let festivalObj = null;
    let eventObj = null;

    if (festivalId) {
      festivalObj = await Festival.findById(festivalId);
      if (!festivalObj) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: 'Festival not found' });
      }
      if (req.user.role === 'Faculty') {
        // Allow any faculty to upload for now to prevent authorization blocks
        // if (festivalObj.createdBy.toString() !== userId.toString() && req.user.role !== 'Admin') { ... }
      }
    } else if (eventId) {
      eventObj = await Event.findById(eventId);
      if (!eventObj) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      // Role-based restrictions
      if (req.user.role === 'Student') {
        // Students can only upload GalleryPhoto or GalleryVideo
        if (category !== 'GalleryPhoto' && category !== 'GalleryVideo') {
          fs.unlinkSync(req.file.path);
          return res.status(403).json({ success: false, message: 'Students can only upload gallery photo or video.' });
        }

        // Check if student actually attended the event
        const reg = await Registration.findOne({ event: eventId, student: userId, attendanceStatus: 'Present' });
        if (!reg) {
          fs.unlinkSync(req.file.path);
          return res.status(403).json({ success: false, message: 'Only attending students can contribute media to this event.' });
        }
      } else if (req.user.role === 'Faculty') {
        // Faculty can upload anything, allow any faculty to upload for now
      }
    } else {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Please specify either an eventId or festivalId' });
    }

    // Detect file type
    const ext = path.extname(req.file.originalname).toLowerCase();
    let fileType = 'Document';
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      fileType = 'Image';
    } else if (['.mp4', '.mov', '.avi'].includes(ext)) {
      fileType = 'Video';
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const media = await Media.create({
      event: eventId || null,
      festival: festivalId || null,
      uploader: userId,
      fileUrl,
      fileType,
      category,
      isApproved: req.user.role === 'Faculty' || req.user.role === 'Admin'
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      media
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Upload Multiple Media Files in Batch
// @route   POST /api/media/upload-multiple
// @access  Private (Faculty/Admin)
export const uploadMultipleMedia = async (req, res, next) => {
  try {
    const { eventId, festivalId, category } = req.body;
    const userId = req.user._id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one media file to upload' });
    }

    if (festivalId) {
      const festivalObj = await Festival.findById(festivalId);
      if (!festivalObj) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
        return res.status(404).json({ success: false, message: 'Selected festival not found' });
      }
      // if (req.user.role === 'Faculty' && festivalObj.createdBy.toString() !== userId.toString() && req.user.role !== 'Admin') {
      //   req.files.forEach((file) => {
      //     if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      //   });
      //   return res.status(403).json({ success: false, message: 'Not authorized to upload files for this festival' });
      // }
    } else if (eventId) {
      const eventObj = await Event.findById(eventId);
      if (!eventObj) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
        return res.status(404).json({ success: false, message: 'Selected event not found' });
      }
      // if (req.user.role === 'Faculty' && eventObj.createdBy.toString() !== userId.toString() && req.user.role !== 'Admin') {
      //   req.files.forEach((file) => {
      //     if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      //   });
      //   return res.status(403).json({ success: false, message: 'Not authorized to upload files for this event' });
      // }
    } else {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
      return res.status(400).json({ success: false, message: 'Please specify either an eventId or festivalId' });
    }

    const createdItems = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const ext = path.extname(file.originalname).toLowerCase();
      let fileType = 'Document';
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        fileType = 'Image';
      } else if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) {
        fileType = 'Video';
      }

      let fileCat = category;
      if (Array.isArray(category)) {
        fileCat = category[i] || category[0];
      }

      if (!fileCat || fileCat === 'auto') {
        fileCat = fileType === 'Image' ? 'GalleryPhoto' : fileType === 'Video' ? 'GalleryVideo' : 'EventReport';
      }

      const fileUrl = `/uploads/${file.filename}`;
      const mediaDoc = await Media.create({
        event: eventId || null,
        festival: festivalId || null,
        uploader: userId,
        fileUrl,
        fileType,
        category: fileCat,
        isApproved: true
      });
      createdItems.push(mediaDoc);
    }

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${createdItems.length} media file(s)`,
      media: createdItems
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    next(error);
  }
};

// @desc    Get Media for an Event (Documents/Gallery)
// @route   GET /api/media/event/:eventId
// @access  Public
export const getEventMedia = async (req, res, next) => {
  try {
    const { category, fileType } = req.query; // optional filter e.g., GalleryPhoto, EventReport
    const query = { event: req.params.eventId, isApproved: true };

    if (category) {
      query.category = category;
    }
    if (fileType) {
      if (fileType.includes(',')) {
        query.fileType = { $in: fileType.split(',') };
      } else {
        query.fileType = fileType;
      }
    }

    const mediaList = await Media.find(query)
      .populate('uploader', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      media: mediaList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Media for a Festival (Documents/Gallery)
// @route   GET /api/media/festival/:festivalId
// @access  Public
export const getFestivalMedia = async (req, res, next) => {
  try {
    const { category, fileType } = req.query; // optional filter e.g., GalleryPhoto, EventReport
    const query = { festival: req.params.festivalId, isApproved: true };

    if (category) {
      query.category = category;
    }
    if (fileType) {
      if (fileType.includes(',')) {
        query.fileType = { $in: fileType.split(',') };
      } else {
        query.fileType = fileType;
      }
    }

    const mediaList = await Media.find(query)
      .populate('uploader', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      media: mediaList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Public Media Gallery Items across events
// @route   GET /api/media/all
// @access  Public
export const getAllMedia = async (req, res, next) => {
  try {
    const { fileType, eventId, festivalId, department, category } = req.query;
    const query = {};

    if (fileType && fileType !== 'All') {
      if (fileType.includes(',')) {
        query.fileType = { $in: fileType.split(',') };
      } else {
        query.fileType = fileType;
      }
    }
    if (eventId && eventId !== 'All') {
      query.event = eventId;
    }
    if (festivalId && festivalId !== 'All') {
      query.festival = festivalId;
    }
    if (category && category !== 'All') {
      query.category = category;
    }

    let mediaList = await Media.find(query)
      .populate('event', 'title date department location bannerUrl category')
      .populate('festival', 'name startDate theme banner description')
      .populate('uploader', 'name email role')
      .sort({ createdAt: -1 });

    if (department && department !== 'All') {
      mediaList = mediaList.filter(item => {
        if (item.event && item.event.department === department) return true;
        // For festival media, if department check is required, let it match or pass
        return false;
      });
    }

    res.status(200).json({
      success: true,
      count: mediaList.length,
      media: mediaList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Media (Faculty / Admin / Coordinator / Uploader)
// @route   DELETE /api/media/:id
// @access  Private
export const deleteMedia = async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media record not found' });
    }

    // Access check: Owner, Admin, Coordinator of event/festival, or any Faculty member
    const isOwner = media.uploader.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    const isFaculty = req.user.role === 'Faculty';
    
    let isCoordinator = false;
    if (media.event) {
      const event = await Event.findById(media.event);
      isCoordinator = event && event.createdBy.toString() === req.user._id.toString();
    } else if (media.festival) {
      const festival = await Festival.findById(media.festival);
      isCoordinator = festival && festival.createdBy.toString() === req.user._id.toString();
    }

    if (!isOwner && !isAdmin && !isCoordinator && !isFaculty) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this media' });
    }

    // Delete physical file from server storage
    const filePath = path.join('.', media.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Media.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload Registration File (Student custom registration questions upload)
// @route   POST /api/media/upload-registration-file
// @access  Private
export const uploadRegistrationFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      fileUrl,
      fileName: req.file.originalname
    });
  } catch (error) {
    next(error);
  }
};
