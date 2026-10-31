import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

import { registerFonts } from './pdf/helpers.js';
import { drawBaseLayout } from './pdf/layout.js';
import { drawHeader } from './pdf/header.js';
import { drawTitle } from './pdf/title.js';
import { drawStudentInfo } from './pdf/student.js';
import { drawContent } from './pdf/content.js';
import { drawSignatures } from './pdf/signatures.js';
import { drawFooter } from './pdf/footer.js';

const certsDir = './uploads/certificates';
if (!fs.existsSync(certsDir)){
    fs.mkdirSync(certsDir, { recursive: true });
}

export const generateCertificatePDF = (student, event, config, certificateId, filePath, registration = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      let studentName = student.name || student;
      let enrollmentNumber = student.enrollmentNumber || '';
      let eventObj = typeof event === 'string' ? { title: event } : event;
      let certConfig = config || {};
      let certId = certificateId;
      let destPath = filePath;

      // Ensure directory exists for file path
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
      }

      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
        autoFirstPage: true
      });

      const writeStream = fs.createWriteStream(destPath);
      doc.pipe(writeStream);

      const width = doc.page.width;
      const height = doc.page.height;

      // Register fonts (falls back to native Times for premium feel if TTF missing)
      const fonts = registerFonts(doc);

      // 1. Base Layout (Cream Background, Borders, Watermark)
      drawBaseLayout(doc, width, height, certConfig);

      // 2. Dynamic Layout Engine
      // Margins are 30. Printable area starts at Y=30 and goes to Y=565.
      // Total Printable Height = 535.28 pt.
      // Header Zone: 85 pt
      // Title Zone: 53 pt
      // Student Name Zone: 53 pt
      // Content Zone: 171 pt
      // Signature Zone: 117 pt
      // Footer Zone: 56 pt

      let currentY = 30;

      // Header
      drawHeader(doc, width, currentY, 85, certConfig);
      currentY += 85;
      
      // Title
      drawTitle(doc, width, currentY, 53, certConfig, fonts);
      currentY += 53;
      
      // Student Info
      drawStudentInfo(doc, width, currentY, 53, studentName, enrollmentNumber, eventObj, fonts);
      currentY += 53;
      
      // Content
      drawContent(doc, width, currentY, 171, student, eventObj, certConfig, fonts, registration);
      currentY += 171;
      
      // Signatures
      drawSignatures(doc, width, currentY, 117, certConfig, fonts);
      currentY += 117;

      // Footer
      await drawFooter(doc, width, height, currentY, 56, studentName, eventObj, certId, fonts);

      doc.end();

      writeStream.on('finish', () => resolve(destPath));
      writeStream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};
