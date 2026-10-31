import { COLORS } from './helpers.js';

export const drawStudentInfo = (doc, width, startY, height, studentName, enrollmentNumber, eventObj, fonts) => {
  let nameFontSize = 42; // Start slightly smaller so it fits within the 53pt zone height
  const safeNameWidth = width - 160; 

  doc.font(fonts.titleFont).fontSize(nameFontSize);
  let textWidth = doc.widthOfString(studentName.toUpperCase());
  let textHeight = doc.heightOfString(studentName.toUpperCase(), { width: safeNameWidth, align: 'center' });

  // Dynamically reduce font size if name is too long or breaks into more than 2 lines, or exceeds height
  while ((textWidth > safeNameWidth || textHeight > height - 5) && nameFontSize > 18) {
    nameFontSize -= 2;
    doc.fontSize(nameFontSize);
    textWidth = doc.widthOfString(studentName.toUpperCase());
    textHeight = doc.heightOfString(studentName.toUpperCase(), { width: safeNameWidth, align: 'center' });
  }

  // Draw Student Name (Dark Blue/Navy)
  // Centered vertically in its 53pt zone
  const yOffset = startY + (height - textHeight) / 2;

  doc.fillColor(COLORS.navy)
     .text(studentName.toUpperCase(), 0, yOffset, {
       width: width,
       align: 'center'
     });

  // NO enrollment number, NO department underneath.
};
