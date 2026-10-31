import { COLORS, getImagePath, isValidImage } from './helpers.js';

export const drawBaseLayout = (doc, width, height, config) => {
  // 1. Draw Cream White Background
  doc.rect(0, 0, width, height).fill(COLORS.creamWhite);

  // 2. Premium Double Borders
  // Outer Gold Border
  doc.rect(15, 15, width - 30, height - 30).lineWidth(4).stroke(COLORS.gold);
  // Outer Navy Border
  doc.rect(21, 21, width - 42, height - 42).lineWidth(6).stroke(COLORS.navy);
  // Inner Gold Border
  doc.rect(32, 32, width - 64, height - 64).lineWidth(1).stroke(COLORS.gold);
  
  // Corner Ornaments
  const drawCorner = (x, y, orientX, orientY) => {
    doc.polygon(
      [x, y],
      [x + 40 * orientX, y],
      [x, y + 40 * orientY]
    ).fill(COLORS.navy);
    doc.polygon(
      [x, y],
      [x + 35 * orientX, y],
      [x, y + 35 * orientY]
    ).fill(COLORS.gold);
  };

  drawCorner(15, 15, 1, 1); // Top-Left
  drawCorner(width - 15, 15, -1, 1); // Top-Right
  drawCorner(15, height - 15, 1, -1); // Bottom-Left
  drawCorner(width - 15, height - 15, -1, -1); // Bottom-Right

  // 3. Watermark
  if (config.logos && config.logos.length > 0) {
    const primaryLogoUrl = config.logos[0];
    if (isValidImage(primaryLogoUrl)) {
      try {
        const primaryLogoPath = getImagePath(primaryLogoUrl);
        doc.save();
        // Very subtle opacity for watermark as requested (3-5%)
        doc.opacity(0.04);
        doc.image(primaryLogoPath, (width - 350) / 2, (height - 350) / 2, { width: 350, height: 350, fit: [350, 350], align: 'center', valign: 'center' });
        doc.restore();
      } catch (watermarkErr) {
        doc.restore();
        console.warn('Could not draw watermark logo in PDF:', watermarkErr.message);
      }
    }
  }
};
