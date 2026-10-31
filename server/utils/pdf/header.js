import { getImagePath, isValidImage } from './helpers.js';

export const drawHeader = (doc, width, startY, height, config) => {
  const validLogos = (config.logos || []).filter(logoUrl => isValidImage(logoUrl));
  
  if (validLogos.length > 0) {
    const count = validLogos.length;
    
    // Page width is 841.89, safe margins are ~80 on each side -> safe area is ~680.
    const safeStartX = 80;
    const safeWidth = width - 160;
    
    // Calculate max width per logo dynamically based on count, max 100
    const logoMaxWidth = Math.min(100, (safeWidth / count) - 10);
    // Calculate max height based on the zone height (85pt), leaving 10pt for padding
    const logoMaxHeight = height - 10;
    
    validLogos.forEach((logoUrl, idx) => {
      const logoPath = getImagePath(logoUrl);
      let startX;
      
      if (count === 1) {
        // Center
        startX = (width - logoMaxWidth) / 2;
      } else {
        // Distribute evenly
        // e.g. for 2 logos: left edge and right edge
        // for 3: left, center, right
        const step = (safeWidth - logoMaxWidth) / (count - 1);
        startX = safeStartX + (idx * step);
      }

      // Draw inside the strict bounding box height
      // Center vertically in the zone
      const yOffset = startY + 5;
      
      try {
        doc.image(logoPath, startX, yOffset, { 
          fit: [logoMaxWidth, logoMaxHeight], 
          align: 'center', 
          valign: 'center' 
        });
      } catch (logoErr) {
        console.warn('Could not draw header logo in PDF:', logoErr.message);
      }
    });
  }
};
