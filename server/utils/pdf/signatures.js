import { COLORS, getImagePath, isValidImage } from './helpers.js';

export const drawSignatures = (doc, width, startY, height, config, fonts) => {
  const signatories = config.signatories || [];
  const count = signatories.length;
  
  if (count === 0) return;

  // We no longer reserve a massive 200px gap for the QR code since the QR code is moved to the Footer zone.
  const safeMarginLeft = 60;
  const safeMarginRight = 60; 
  const safeWidth = width - safeMarginLeft - safeMarginRight;
  
  // Determine Grid dimensions
  let cols = count;
  let rows = 1;
  
  if (count === 4) {
    cols = 2; rows = 2;
  } else if (count >= 5 && count <= 6) {
    cols = 3; rows = 2;
  } else if (count >= 7 && count <= 8) {
    cols = 4; rows = 2;
  } else if (count > 8) {
    cols = 4; rows = Math.ceil(count / 4);
  }

  // Calculate cell dimensions
  const cellWidth = safeWidth / cols;
  const cellHeight = height / rows;
  
  // Scale fonts based on rows
  const nameFontSize = rows >= 3 ? 8 : (rows === 2 ? 9 : 10);
  const desigFontSize = rows >= 3 ? 6 : (rows === 2 ? 7 : 8);
  const maxImageHeight = rows >= 3 ? 15 : (rows === 2 ? 25 : 40);
  const sigBlockWidth = Math.min(180, cellWidth - 10); // leave some padding

  signatories.forEach((sig, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    
    // Calculate the number of items in the current row to center them if the row isn't full
    const itemsInRow = row === rows - 1 && count % cols !== 0 ? count % cols : cols;
    
    // Start X for this specific row's centering
    const rowWidth = itemsInRow * cellWidth;
    const rowStartX = safeMarginLeft + (safeWidth - rowWidth) / 2;
    
    // Position of cell within the row
    // Wait, col must be adjusted if the row has fewer items.
    // If it's the last row, the column index relative to the row is `col` (since `idx % cols` works sequentially).
    const cellStartX = rowStartX + (col * cellWidth);
    const cellStartY = startY + (row * cellHeight);
    
    const sigStartX = cellStartX + (cellWidth - sigBlockWidth) / 2;
    
    // Draw signature image
    let imageOffset = 0;
    if (sig.signatureUrl && isValidImage(sig.signatureUrl)) {
      try {
        const sigPath = getImagePath(sig.signatureUrl);
        doc.image(sigPath, sigStartX + (sigBlockWidth - 100) / 2, cellStartY, { 
          fit: [100, maxImageHeight], 
          align: 'center', 
          valign: 'center' 
        });
      } catch (imgErr) {
        console.warn('Could not draw signature image in PDF:', imgErr.message);
      }
      imageOffset = maxImageHeight + 2;
    } else {
      imageOffset = maxImageHeight + 2;
    }
    
    // Draw signature line below the image
    const lineY = cellStartY + imageOffset;
    doc.moveTo(sigStartX + 10, lineY)
       .lineTo(sigStartX + sigBlockWidth - 10, lineY)
       .lineWidth(1)
       .stroke(COLORS.navy);
       
    // Name
    doc.font(fonts.titleFont)
       .fontSize(nameFontSize)
       .fillColor(COLORS.textMain)
       .text(sig.name || '', sigStartX, lineY + 4, { 
         width: sigBlockWidth, 
         align: 'center' 
       });
       
    // Designation
    if (sig.designation) {
      doc.font(fonts.bodyFont)
         .fontSize(desigFontSize)
         .fillColor(COLORS.textSecondary)
         .text(sig.designation, sigStartX, lineY + 4 + nameFontSize + 2, { 
           width: sigBlockWidth, 
           align: 'center' 
         });
    }
  });
};
