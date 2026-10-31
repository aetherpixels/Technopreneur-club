import { COLORS } from './helpers.js';

export const replacePlaceholders = (text, student, event, config, registration = null) => {
  if (!text) return '';
  const studentName = student.name || student;
  const enrollmentNumber = student.enrollmentNumber || 'N/A';
  const studentDepartment = student.department || event.department || 'Computer Engineering';
  const studentSemester = student.semester || 'N/A';
  const studentEmail = student.email || 'N/A';
  
  const dateStr = event.date ? new Date(event.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : 'N/A';
  
  const issueDateStr = new Date(config.issueDate || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const yearNum = event.date ? new Date(event.date).getFullYear() : new Date().getFullYear();
  const monthNum = event.date ? new Date(event.date).getMonth() : new Date().getMonth();
  const academicYear = `${yearNum - (monthNum < 6 ? 1 : 0)}-${yearNum + (monthNum >= 6 ? 1 : 0)}`;

  // Registration data
  const regDateStr = registration && registration.createdAt 
    ? new Date(registration.createdAt).toLocaleDateString('en-US') 
    : 'N/A';
  const regId = registration ? (registration.registrationId || registration._id) : 'N/A';

  // The user requested these specific bolded tokens via ** in their template
  return text
    .replace(/\{\{Student Name\}\}/g, studentName)
    .replace(/\{\{Enrollment Number\}\}/g, enrollmentNumber)
    .replace(/\{\{Student Department\}\}/g, studentDepartment)
    .replace(/\{\{Semester\}\}/g, studentSemester)
    .replace(/\{\{Email\}\}/g, studentEmail)
    .replace(/\{\{Event Name\}\}/g, event.title || event.name || 'N/A')
    .replace(/\{\{Event Type\}\}/g, event.type || 'Event')
    .replace(/\{\{Description\}\}/g, event.description || '')
    .replace(/\{\{Department\}\}/g, event.department || studentDepartment)
    .replace(/\{\{Organizer Name\}\}/g, event.coordinators?.faculty?.[0]?.name || 'Faculty Organizer')
    .replace(/\{\{Organizer\}\}/g, event.coordinators?.faculty?.[0]?.name || 'Faculty Organizer')
    .replace(/\{\{Faculty Name\}\}/g, event.coordinators?.faculty?.[0]?.name || 'Faculty Name')
    .replace(/\{\{Event Venue\}\}/g, event.venue || 'Institutional Campus')
    .replace(/\{\{Venue\}\}/g, event.venue || 'Institutional Campus')
    .replace(/\{\{Event Date\}\}/g, dateStr)
    .replace(/\{\{Time\}\}/g, event.time || 'N/A')
    .replace(/\{\{Organized By\}\}/g, event.organizedBy || event.department || 'College')
    .replace(/\{\{Registration Type\}\}/g, event.registrationType || 'N/A')
    .replace(/\{\{Event Duration\}\}/g, event.duration || 'N/A')
    .replace(/\{\{Event Category\}\}/g, event.category || 'N/A')
    .replace(/\{\{Issue Date\}\}/g, issueDateStr)
    .replace(/\{\{Academic Year\}\}/g, academicYear)
    .replace(/\{\{Registration Date\}\}/g, regDateStr)
    .replace(/\{\{Registration ID\}\}/g, regId)
    .replace(/\{\{Certificate ID\}\}/g, config.certificateId || 'ID');
};

export const drawContent = (doc, width, startY, height, student, eventObj, config, fonts, registration = null) => {
  
  const defaultText = `This is to certify that **{{Student Name}}** has successfully participated in the **{{Event Type}}** titled **"{{Event Name}}"** organized by **{{Organizer Name}}** on **{{Event Date}}** at **{{Event Venue}}** during the Academic Year **{{Academic Year}}**.\n\nYour dedication, enthusiasm, teamwork, and valuable contribution throughout the event are sincerely appreciated. We congratulate you on your successful participation and extend our best wishes for your continued academic, professional, and personal success.`;
  
  const substitutedDesc = replacePlaceholders(
    config.description || defaultText,
    student,
    eventObj,
    config,
    registration
  );

  const contentWidth = width * 0.70; // Max width 70%
  const startX = (width - contentWidth) / 2;
  
  // Dynamic Scaling Engine
  let fontSize = 18;
  let lineGap = 8;
  
  const rawText = substitutedDesc.replace(/\*\*/g, '');
  
  doc.font(fonts.bodyFontBold).fontSize(fontSize); // Use bold for conservative height measure
  let textHeight = doc.heightOfString(rawText, { width: contentWidth, lineGap: lineGap });

  while (textHeight > height && fontSize > 14) {
    fontSize -= 1;
    lineGap = Math.max(4, lineGap - 1); // reduce lineGap slightly as well
    doc.fontSize(fontSize);
    textHeight = doc.heightOfString(rawText, { width: contentWidth, lineGap: lineGap });
  }

  // Simple Rich Text Parser for **bold**
  const parts = substitutedDesc.split('**');
  
  // Center vertically if there is space
  const yOffset = startY + (height > textHeight ? (height - textHeight) / 2 : 0);
  
  doc.fillColor(COLORS.textMain);
  
  parts.forEach((part, index) => {
    const isBold = index % 2 === 1;
    const isLast = index === parts.length - 1;
    
    if (isBold) {
      doc.font(fonts.bodyFontBold).fontSize(fontSize);
    } else {
      doc.font(fonts.bodyFont).fontSize(fontSize);
    }

    if (index === 0) {
      doc.text(part, startX, yOffset, {
        width: contentWidth,
        align: 'center',
        lineGap: lineGap,
        continued: !isLast
      });
    } else {
      doc.text(part, {
        continued: !isLast
      });
    }
  });
};
