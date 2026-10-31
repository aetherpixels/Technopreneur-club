import Registration from '../models/Registration.js';
import User from '../models/User.js';
import Certificate from '../models/Certificate.js';
import CertificateConfig from '../models/CertificateConfig.js';
import Event from '../models/Event.js';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { generateCertificatePDF } from '../utils/pdfGenerator.js';
import { processImageBackground } from '../utils/imageProcessor.js';

// @desc    Get Certificate Configuration for an Event
// @route   GET /api/certificates/config/:eventId
// @access  Private (Faculty/Admin)
export const getCertificateConfig = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const config = await CertificateConfig.findOne({ event: eventId });
    
    if (!config) {
      return res.status(200).json({ success: true, configExists: false, config: null });
    }
    
    res.status(200).json({ success: true, configExists: true, config });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or Update Certificate Configuration
// @route   POST /api/certificates/config
// @access  Private (Faculty/Admin)
export const upsertCertificateConfig = async (req, res, next) => {
  try {
    const { eventId, title, description, issueDate } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Please provide eventId' });
    }

    // Parse existing images array and signatories array from JSON strings
    let existingLogos = [];
    if (req.body.existingLogos) {
      existingLogos = JSON.parse(req.body.existingLogos);
    }

    let signatories = [];
    if (req.body.signatories) {
      signatories = JSON.parse(req.body.signatories);
    }

    // Process new logos
    const newLogos = [];
    if (req.files && req.files['logos']) {
      for (const file of req.files['logos']) {
        const processedFilename = 'logo-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + '.png';
        const processedPath = path.join('uploads', processedFilename);
        
        try {
          await processImageBackground(file.path, processedPath, false);
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          newLogos.push('/uploads/' + processedFilename);
        } catch (err) {
          console.error("Failed to process logo image:", err);
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      }
    }
    const finalLogos = [...existingLogos, ...newLogos];

    // Process signatories and their signature uploads
    let signatureFileIndex = 0;
    const processedSignatories = [];

    for (const sig of signatories) {
      let finalSigUrl = sig.signatureUrl || '';

      // If signatory requires new signature file upload
      if ((!sig.signatureUrl || sig.signatureUrl === '') && req.files && req.files['signatures']) {
        const file = req.files['signatures'][signatureFileIndex];
        if (file) {
          const processedFilename = 'sig-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + '.png';
          const processedPath = path.join('uploads', processedFilename);
          
          try {
            await processImageBackground(file.path, processedPath, true);
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            finalSigUrl = '/uploads/' + processedFilename;
          } catch (err) {
            console.error("Failed to process signature image:", err);
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          }
          signatureFileIndex++;
        }
      }

      processedSignatories.push({
        name: sig.name,
        designation: sig.designation || '',
        signatureUrl: finalSigUrl
      });
    }

    const config = await CertificateConfig.findOneAndUpdate(
      { event: eventId },
      {
        title: title || 'Certificate of Participation',
        description,
        logos: finalLogos,
        signatories: processedSignatories,
        issueDate: issueDate || new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Certificate configuration saved successfully',
      config
    });
  } catch (error) {
    // Cleanup temporary multer files in case of failure
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        req.files[key].forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }
    next(error);
  }
};

// @desc    Generate Temporary Certificate Layout Preview PDF
// @route   POST /api/certificates/preview
// @access  Private (Faculty/Admin)
export const getCertificatePreview = async (req, res, next) => {
  try {
    const { title, description, issueDate, eventId } = req.body;

    let existingLogos = [];
    if (req.body.existingLogos) {
      existingLogos = JSON.parse(req.body.existingLogos);
    }

    let signatories = [];
    if (req.body.signatories) {
      signatories = JSON.parse(req.body.signatories);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Process new logos
    const newLogos = [];
    if (req.files && req.files['logos']) {
      for (const file of req.files['logos']) {
        const processedFilename = 'logo-preview-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + '.png';
        const processedPath = path.join('uploads', processedFilename);
        try {
          await processImageBackground(file.path, processedPath, false);
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          newLogos.push('/uploads/' + processedFilename);
        } catch (err) {
          console.error("Failed to process logo preview image:", err);
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      }
    }
    const finalLogos = [...existingLogos, ...newLogos];

    // Process signatures
    let signatureFileIndex = 0;
    const processedSignatories = [];

    for (const sig of signatories) {
      let finalSigUrl = sig.signatureUrl || '';
      if ((!sig.signatureUrl || sig.signatureUrl === '') && req.files && req.files['signatures']) {
        const file = req.files['signatures'][signatureFileIndex];
        if (file) {
          const processedFilename = 'sig-preview-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + '.png';
          const processedPath = path.join('uploads', processedFilename);
          try {
            await processImageBackground(file.path, processedPath, true);
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            finalSigUrl = '/uploads/' + processedFilename;
          } catch (err) {
            console.error("Failed to process signature preview image:", err);
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          }
          signatureFileIndex++;
        }
      }
      processedSignatories.push({
        name: sig.name,
        designation: sig.designation || '',
        signatureUrl: finalSigUrl
      });
    }

    // Find the student who registered first for this event
    const firstRegistration = await Registration.findOne({ event: eventId, status: { $ne: 'Cancelled' } })
      .sort({ createdAt: 1, registrationDate: 1 })
      .populate('student', 'name email enrollmentNumber department semester');

    let previewStudent;
    let previewRegistration;

    if (firstRegistration && firstRegistration.student) {
      previewStudent = {
        name: firstRegistration.student.name || 'Registered Student',
        enrollmentNumber: firstRegistration.student.enrollmentNumber || '',
        department: firstRegistration.student.department || firstRegistration.department || event.department || 'Academic Department',
        semester: firstRegistration.student.semester || 'N/A',
        email: firstRegistration.student.email || ''
      };
      previewRegistration = firstRegistration;
    } else {
      // Fallback sample student if no student has registered for the event yet
      previewStudent = {
        name: 'Sample Student Name',
        enrollmentNumber: '21012011001',
        department: event.department || 'Computer Engineering',
        semester: 'Semester 6',
        email: 'student@example.com'
      };
      previewRegistration = {
        _id: 'REG' + Date.now(),
        createdAt: new Date(),
        student: previewStudent,
        event: event
      };
    }

    const mockConfig = {
      title: title || 'Certificate of Participation',
      description,
      logos: finalLogos,
      signatories: processedSignatories,
      issueDate: issueDate || new Date()
    };

    const tempFilename = 'preview-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + '.pdf';
    const tempFilePath = path.join('uploads', 'certificates', tempFilename);

    await generateCertificatePDF(previewStudent, event, mockConfig, 'EH-PREVIEW-MOCK', tempFilePath, previewRegistration);

    // Stream PDF back directly
    const absolutePath = path.resolve(tempFilePath);
    res.setHeader('Content-Type', 'application/pdf');
    
    res.sendFile(absolutePath, {}, (err) => {
      if (err) {
        console.error('Error streaming preview PDF:', err);
        if (!res.headersSent) {
          return next(err);
        }
      }
      // Delete temporary preview assets after client has received the stream
      setTimeout(() => {
        try {
          if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
          newLogos.forEach(logoUrl => {
            const p = path.join(process.cwd(), logoUrl.substring(1));
            if (fs.existsSync(p)) fs.unlinkSync(p);
          });
          processedSignatories.forEach(sig => {
            if (sig.signatureUrl && sig.signatureUrl.includes('-preview-')) {
              const p = path.join(process.cwd(), sig.signatureUrl.substring(1));
              if (fs.existsSync(p)) fs.unlinkSync(p);
            }
          });
        } catch (cleanupErr) {
          console.warn('Error cleaning up preview assets:', cleanupErr.message);
        }
      }, 10000);
    });
  } catch (error) {
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        req.files[key].forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }
    next(error);
  }
};

// @desc    Download / Stream Student Certificate for a specific Event
// @route   GET /api/certificates/:eventId
// @access  Private
export const downloadCertificate = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user._id;

    // Verify registration and attendance
    const registration = await Registration.findOne({ event: eventId, student: studentId })
      .populate('student', 'name email enrollmentNumber')
      .populate('event');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'No registration record found for this event.' });
    }

    if (registration.attendanceStatus !== 'Present') {
      return res.status(403).json({ 
        success: false, 
        message: 'Certificate unavailable. Attendance is marked as Absent or Pending.' 
      });
    }

    // Check if certificate config exists
    const config = await CertificateConfig.findOne({ event: eventId });
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificates are not configured for this event by the faculty coordinator yet.' 
      });
    }

    // Check if certificate record already exists
    let certificateObj = await Certificate.findOne({ event: eventId, student: studentId });
    let certFilePath;

    if (certificateObj) {
      certFilePath = certificateObj.downloadUrl;
      // Double check if file exists physically
      if (!fs.existsSync(certFilePath)) {
        await generateCertificatePDF(
          registration.student,
          registration.event,
          config,
          certificateObj.certificateId,
          certFilePath,
          registration
        );
      }
    } else {
      // Generate a new Certificate Record
      const hashInput = `${studentId}-${eventId}-${Date.now()}`;
      const certificateId = 'EHCERT-' + crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 12).toUpperCase();
      
      const fileName = `${certificateId}.pdf`;
      certFilePath = path.join('uploads', 'certificates', fileName);

      // Call PDFKit Generator with config
      await generateCertificatePDF(
        registration.student,
        registration.event,
        config,
        certificateId,
        certFilePath,
        registration
      );

      // Save to database
      certificateObj = await Certificate.create({
        certificateId,
        registration: registration._id,
        event: eventId,
        student: studentId,
        downloadUrl: certFilePath
      });

      // Update certificate status
      registration.certificateStatus = 'Downloaded';
      await registration.save();
    }

    // Stream PDF file back to client
    const absolutePath = path.resolve(certFilePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate_${registration.event.title.replace(/\s+/g, '_')}.pdf`);
    res.sendFile(absolutePath);

  } catch (error) {
    next(error);
  }
};

// @desc    Get List of Certificates earned by Logged-in Student
// @route   GET /api/certificates
// @access  Private/Student
export const getMyCertificates = async (req, res, next) => {
  try {
    // 1. Find all registrations for this student where they were marked Present
    const registrations = await Registration.find({ student: req.user._id, attendanceStatus: 'Present' })
      .populate('student', 'name email enrollmentNumber')
      .populate('event');

    // 2. Ensure a Certificate document exists for each present registration (if configured)
    for (const reg of registrations) {
      const config = await CertificateConfig.findOne({ event: reg.event._id });
      if (!config) continue; // Skip generating if not configured by faculty yet

      let certificateObj = await Certificate.findOne({ event: reg.event._id, student: req.user._id });
      if (!certificateObj) {
        const hashInput = `${req.user._id}-${reg.event._id}-${Date.now()}`;
        const certificateId = 'EHCERT-' + crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 12).toUpperCase();
        
        const fileName = `${certificateId}.pdf`;
        const certFilePath = path.join('uploads', 'certificates', fileName);

        // Call PDFKit Generator to physically write the PDF file
        await generateCertificatePDF(
          reg.student,
          reg.event,
          config,
          certificateId,
          certFilePath,
          reg
        );

        // Save certificate to database
        await Certificate.create({
          certificateId,
          registration: reg._id,
          event: reg.event._id,
          student: req.user._id,
          downloadUrl: certFilePath
        });

        // Update registration's certificate status
        reg.certificateStatus = 'Downloaded';
        await reg.save();
      }
    }

    // 3. Find and return all certificates for this student
    const certificates = await Certificate.find({ student: req.user._id })
      .populate('event')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      certificates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto Generate Certificates for Present Students in Background
// @access  Internal
export const autoGenerateCertificates = async (eventId, presentStudentIds) => {
  try {
    const config = await CertificateConfig.findOne({ event: eventId });
    if (!config) return;

    for (const studentId of presentStudentIds) {
      const reg = await Registration.findOne({ event: eventId, student: studentId })
        .populate('student', 'name email enrollmentNumber department')
        .populate('event');
      if (!reg || reg.attendanceStatus !== 'Present') continue;

      let certificateObj = await Certificate.findOne({ event: eventId, student: studentId });
      if (!certificateObj) {
        const hashInput = `${studentId}-${eventId}-${Date.now()}`;
        const certificateId = 'EHCERT-' + crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 12).toUpperCase();
        
        const fileName = `${certificateId}.pdf`;
        const certFilePath = path.join('uploads', 'certificates', fileName);

        // Call PDFKit Generator to physically write the PDF file
        await generateCertificatePDF(
          reg.student,
          reg.event,
          config,
          certificateId,
          certFilePath,
          reg
        );

        // Save certificate to database
        await Certificate.create({
          certificateId,
          registration: reg._id,
          event: eventId,
          student: studentId,
          downloadUrl: certFilePath
        });
      }
    }
  } catch (error) {
    console.error('Error auto-generating certificates:', error);
  }
};
